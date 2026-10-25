import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EDGE_HTML_MAX_STALE_MS } from '@repo/common-lib/constants/edge-cache';
import { getLockClient } from 'src/common/utils/cron-lock';

/**
 * Cloudflare purge calls allowed per sliding window, across every api replica. The account's
 * bucket (Free: 5 a minute) is shared with the deploy's hostname purge, so one is left for it.
 */
export const EDGE_PURGE_CALLS_PER_WINDOW = 4;
export const EDGE_PURGE_WINDOW_MS = 60_000;

const CALLS_KEY = 'edge-purge:cf-calls';
const lastPurgedKey = (userId: number) => `edge-purge:last-purged:${userId}`;

/**
 * Older stamps are never consulted: a job queued before them is already past the edge TTL and
 * dropped as stale anyway.
 */
const LAST_PURGED_TTL_MS = 2 * EDGE_HTML_MAX_STALE_MS;

/**
 * Sliding-window slot take on the Redis clock (one clock for every replica). Returns 0 when the
 * slots were taken, otherwise how many ms until enough slots free up.
 */
const TAKE_SLOTS_SCRIPT = `
local key = KEYS[1]
local max = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local member = ARGV[4]
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local used = redis.call('ZCARD', key)
if used + cost <= max then
  for i = 1, cost do
    redis.call('ZADD', key, now, member .. ':' .. i)
  end
  redis.call('PEXPIRE', key, window)
  return 0
end
local freeing = redis.call('ZRANGE', key, used + cost - max - 1, used + cost - max - 1, 'WITHSCORES')
local wait = tonumber(freeing[2]) + window - now + 1
if wait < 1 then wait = 1 end
return wait
`;

/** Only ever moves the stamp forward, so a slow replica cannot rewind another's later purge. */
const MARK_PURGED_SCRIPT = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local at = tonumber(ARGV[1])
if at > current then
  redis.call('SET', KEYS[1], ARGV[1], 'PX', tonumber(ARGV[2]))
end
return 1
`;

export type SlotResult = { ok: true } | { ok: false; retryInMs: number };

/**
 * The edge purge's shared state in Redis: when each artist was last purged, and the Cloudflare
 * calls made in the current window. Both fail open (no skip, no limit) when Redis cannot be reached;
 * the BullMQ worker that runs the job needs that same Redis, so this is the rare case.
 */
@Injectable()
export class EdgePurgeLedger {
  /** Epoch ms at which the last successful purge of this artist started, or null. */
  async lastPurgedAt(userId: number): Promise<number | null> {
    const client = await getLockClient();
    if (!client) return null;
    const value = await client.get(lastPurgedKey(userId));
    const at = value === null ? NaN : Number(value);
    return Number.isFinite(at) ? at : null;
  }

  async markPurged(userId: number, startedAt: number): Promise<void> {
    const client = await getLockClient();
    if (!client) return;
    await client.eval(MARK_PURGED_SCRIPT, {
      keys: [lastPurgedKey(userId)],
      arguments: [String(startedAt), String(LAST_PURGED_TTL_MS)],
    });
  }

  /**
   * Takes `cost` Cloudflare calls from the shared window, all or none. A cost above the window's
   * size (only possible past ~130 names in one job) is clamped, so such a job still gets to run.
   */
  async takeSlots(cost: number): Promise<SlotResult> {
    const client = await getLockClient();
    if (!client) return { ok: true };
    const wait = Number(
      await client.eval(TAKE_SLOTS_SCRIPT, {
        keys: [CALLS_KEY],
        arguments: [
          String(EDGE_PURGE_CALLS_PER_WINDOW),
          String(EDGE_PURGE_WINDOW_MS),
          String(Math.min(Math.max(1, cost), EDGE_PURGE_CALLS_PER_WINDOW)),
          randomUUID(),
        ],
      }),
    );
    return wait > 0 ? { ok: false, retryInMs: wait } : { ok: true };
  }
}
