import { randomUUID } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { getLockClient } from './cron-lock';

const LOCK_RETRY_MS = 50;

/** Deletes the lock only if this caller still owns it (it may have expired and been re-taken). */
const RELEASE_SCRIPT =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

/**
 * Runs `fn` while holding `user-lock:<key>`, across every API replica.
 *
 * For check-then-insert flows such as plan entity caps: without it, a burst of creates all pass
 * the count check before any of them inserts. A second caller while the lock is held gets a 409,
 * or with `waitMs` keeps retrying for up to that long first (for short critical sections).
 *
 * `ttlMs` only bounds a crashed holder; it must exceed the slowest `fn` (uploads and moderation
 * included), or a second caller could get in while the first is still running.
 *
 * Fails OPEN when Redis is unreachable, like {@link runCronExclusive}: the API cannot serve much
 * without Redis anyway, and refusing every create is worse than the race for that window.
 */
export async function withUserLock<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  { waitMs = 0 }: { waitMs?: number } = {},
): Promise<T> {
  const lockKey = `user-lock:${key}`;
  const token = randomUUID();
  const deadline = Date.now() + waitMs;
  let held = false;
  try {
    const client = await getLockClient();
    if (client) {
      const acquire = () =>
        client.set(lockKey, token, {
          condition: 'NX',
          expiration: { type: 'PX', value: ttlMs },
        });
      let reply = await acquire();
      while (reply !== 'OK' && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS));
        reply = await acquire();
      }
      if (reply !== 'OK') {
        throw new ConflictException(
          'A similar request is still being processed. Try again in a moment.',
        );
      }
      held = true;
    }
  } catch (caught) {
    if (caught instanceof ConflictException) throw caught;
  }

  try {
    return await fn();
  } finally {
    if (held) {
      try {
        const client = await getLockClient();
        await client?.eval(RELEASE_SCRIPT, { keys: [lockKey], arguments: [token] });
      } catch {
        // The TTL releases it.
      }
    }
  }
}

/** Covers a create with a thumbnail upload plus AI moderation. */
export const ENTITY_CREATE_LOCK_TTL_MS = 2 * 60 * 1000;

/** The AI credit check-and-reserve: a few queries, so callers wait for it rather than get a 409. */
export const AI_CREDIT_LOCK_TTL_MS = 30 * 1000;
export const AI_CREDIT_LOCK_WAIT_MS = 10 * 1000;

/** One 2FA verification: a bcrypt compare and a couple of writes. */
export const TWOFA_LOCK_TTL_MS = 30 * 1000;
export const TWOFA_LOCK_WAIT_MS = 10 * 1000;
