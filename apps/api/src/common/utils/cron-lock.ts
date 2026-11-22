import { randomUUID } from 'node:crypto';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { createClient } from 'redis';
import { runWithTraceId } from 'src/common/services/request-storage';
import { apiLogger } from 'src/common/services/request.service';

type RedisClient = ReturnType<typeof createClient>;

/**
 * Run audit for every cron: start, completed/failed, skipped. Operation is the cron name, and
 * `cron` is in every line's extraInfo.
 */
const cronLog = apiLogger('system');

/** Identifies this process in the lock value (useful when inspecting `cron-lock:*` keys). */
const INSTANCE_ID = `${process.env.HOSTNAME ?? 'api'}:${process.pid}:${randomUUID().slice(0, 8)}`;

export type RunCronOptions = {
  /** Write the started/completed/skipped info lines. Default `true`. */
  audit?: boolean;
};

let clientPromise: Promise<RedisClient | null> | null = null;

/** One lazily connected client per process, shared by every lock. Null when Redis is unset/unreachable. */
export const getLockClient = (): Promise<RedisClient | null> => {
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = getConfigValue('redis').url;
      if (!url) return null;
      const client = createClient({ url });
      // Connection errors surface through `set` below; an unhandled 'error' event would crash the process.
      client.on('error', () => undefined);
      await client.connect();
      return client as RedisClient;
    })().catch(() => {
      clientPromise = null; // retry on the next run
      return null;
    });
  }
  return clientPromise;
};

/**
 * Runs a scheduled job on exactly ONE replica per schedule.
 *
 * `@Cron` fires in every process, and production runs `API_REPLICAS` (2) API containers — so every
 * job ran twice: two wait-list reminder emails per person, two AI-generation batches, two IndexNow
 * submissions. The first replica to `SET cron-lock:<name> NX PX <ttl>` runs the job; the others see
 * the key and skip.
 *
 * The lock is deliberately NOT released when the job finishes: replicas' timers can fire seconds
 * apart, and releasing a fast job's lock would let the late replica run it again. It simply expires
 * after `ttlMs`, which must be shorter than the schedule's interval and longer than any clock skew
 * between replicas.
 *
 * Fails OPEN: if Redis cannot be reached the job still runs (the pre-lock behaviour), because a
 * missed nightly job is worse than a rare duplicate while Redis is down.
 *
 * `audit: false` drops the started/completed/skipped info lines, for crons that tick every minute
 * and would otherwise write three lines a minute per replica. `Cron run failed` is always logged.
 *
 * @returns whether this process ran the job.
 */
export async function runCronExclusive(
  name: string,
  ttlMs: number,
  job: () => Promise<void>,
  { audit = true }: RunCronOptions = {},
): Promise<boolean> {
  let acquired = true;
  try {
    const client = await getLockClient();
    if (client) {
      const reply = await client.set(`cron-lock:${name}`, INSTANCE_ID, {
        condition: 'NX',
        expiration: { type: 'PX', value: ttlMs },
      });
      acquired = reply === 'OK';
    }
  } catch {
    acquired = true;
  }
  if (!acquired) {
    if (audit) {
      cronLog.info('Cron run skipped', { cron: name, reason: 'lock_held', operation: name });
    }
    return false;
  }
  // Its own trace: every line of the run and every job it enqueues (via `apiTraceCarrier()` / `requestService.traceCarrier()`) carry this id.
  await runWithTraceId(randomUUID(), async () => {
    const startedAt = Date.now();
    if (audit) cronLog.info('Cron run started', { cron: name, operation: name });
    try {
      await job();
      if (audit) cronLog.info('Cron run completed', { cron: name, duration_ms: Date.now() - startedAt, operation: name });
    } catch (error) {
      cronLog.error('Cron run failed', {
        cron: name,
        duration_ms: Date.now() - startedAt,
        error_name: error instanceof Error ? error.name : typeof error,
        error_message: error instanceof Error ? error.message : String(error),
        operation: name,
      });
      throw error;
    }
  });
  return true;
}

/**
 * Lock lifetimes: comfortably above replica clock skew, comfortably below the schedule interval.
 * `minute` is for every-minute crons: 10 s under the interval leaves room for replica clock skew.
 * `boot` covers one-shot startup jobs: replicas of a deploy start within seconds of each other,
 * and the next deploy (never within 10 minutes) runs the job again.
 */
export const CRON_LOCK_TTL = {
  boot: 10 * 60 * 1000,
  minute: 50 * 1000,
  hourly: 50 * 60 * 1000,
  daily: 23 * 60 * 60 * 1000,
} as const;
