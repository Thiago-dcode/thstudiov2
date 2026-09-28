import { randomUUID } from 'node:crypto';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

/** Identifies this process in the lock value (useful when inspecting `cron-lock:*` keys). */
const INSTANCE_ID = `${process.env.HOSTNAME ?? 'api'}:${process.pid}:${randomUUID().slice(0, 8)}`;

let clientPromise: Promise<RedisClient | null> | null = null;

/** One lazily connected client per process, shared by every cron. Null when Redis is unset/unreachable. */
const getClient = (): Promise<RedisClient | null> => {
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
 * @returns whether this process ran the job.
 */
export async function runCronExclusive(
  name: string,
  ttlMs: number,
  job: () => Promise<void>,
): Promise<boolean> {
  let acquired = true;
  try {
    const client = await getClient();
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
  if (!acquired) return false;
  await job();
  return true;
}

/**
 * Lock lifetimes: comfortably above replica clock skew, comfortably below the schedule interval.
 * `boot` covers one-shot startup jobs: replicas of a deploy start within seconds of each other,
 * and the next deploy (never within 10 minutes) runs the job again.
 */
export const CRON_LOCK_TTL = {
  boot: 10 * 60 * 1000,
  hourly: 50 * 60 * 1000,
  daily: 23 * 60 * 60 * 1000,
} as const;
