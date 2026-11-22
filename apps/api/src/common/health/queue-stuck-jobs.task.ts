import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getConfigValue } from '@repo/common-lib/config/utils';
import {
  PLAN_SUBSCRIPTIONS_QUEUE,
  STRIPE_WEBHOOKS_QUEUE,
} from '@repo/common-lib/constants/queues';
import { maskEmailAddresses } from '@repo/backend-lib/services/log-service';
import { apiLogger } from '../services/request.service';
import { Job, JobType, Queue } from 'bullmq';
import { displayHost } from '../utils';
import { CRON_LOCK_TTL, getLockClient, runCronExclusive } from '../utils/cron-lock';

/**
 * Queues whose jobs must never sit unprocessed: a stuck `stripe-webhooks` or `plan-subscriptions`
 * job is a paid subscription not applied. Adding a queue here also registers it in `HealthModule`;
 * inject it in the task's constructor too.
 */
export const MONITORED_QUEUES = [STRIPE_WEBHOOKS_QUEUE, PLAN_SUBSCRIPTIONS_QUEUE] as const;

/** A pending job older than this, or a delayed job this far past due, means nobody is consuming. */
export const STUCK_AFTER_MS = 120_000;
/** At most one stuck mail per queue in this window, across replicas and ticks. */
export const STUCK_ALERT_COOLDOWN_MS = 30 * 60 * 1000;

/** Jobs read per state. Enough to find the oldest without loading a large backlog. */
const JOB_SAMPLE_SIZE = 50;
/** Job ids listed in an alert. */
const MAX_LISTED_JOBS = 5;
const FAILED_REASON_MAX_LENGTH = 300;

/**
 * `prioritized` is not optional: both queues enqueue with a `priority`, and in BullMQ 6 such jobs
 * sit in `prioritized`, never in `wait`. Reading `wait` alone would never see them.
 * There is no `paused` state in BullMQ 6: a paused queue keeps its jobs in `wait`/`prioritized`.
 */
const PENDING_STATES: JobType[] = ['wait', 'prioritized'];
const COUNTED_STATES: JobType[] = ['wait', 'prioritized', 'delayed', 'active', 'failed'];

export const stuckAlertKey = (queue: string) => `queue-health:alert:${queue}:stuck`;
export const failedWatermarkKey = (queue: string) => `queue-health:failed-watermark:${queue}`;

type PendingJob = Pick<Job, 'id' | 'timestamp'> & Partial<Pick<Job, 'delay' | 'processedOn' | 'attemptsMade'>>;
/** `dueAt` is the exact due time from the delayed set's score; without it the hash fields are used. */
type DelayedJob = Pick<Job, 'id' | 'timestamp' | 'delay'> &
  Partial<Pick<Job, 'processedOn' | 'attemptsMade'>> & { dueAt?: number };
type FailedJob = Pick<Job, 'id' | 'name' | 'finishedOn' | 'failedReason' | 'attemptsMade'>;

export type QueueSnapshot = {
  queue: string;
  counts: Record<string, number>;
  pending: PendingJob[];
  delayed: DelayedJob[];
};

export type QueueEvaluation = {
  stuck: boolean;
  /** Age of the oldest pending job, `null` when nothing is pending. */
  oldestPendingAgeMs: number | null;
  /** How far the earliest-due delayed job is past due (0 if not yet due), `null` when none. */
  oldestDelayedOverdueMs: number | null;
  /** Up to `MAX_LISTED_JOBS` ids of the jobs over the threshold, oldest first. */
  stuckJobIds: string[];
};

/**
 * BullMQ 6 scores the delayed set as `dueAt * 0x1000 + counter` (`getDelayedScore.lua`), so the
 * due time is exact even for a retry, whose `timestamp` is still the creation time.
 */
export const DELAYED_SCORE_FACTOR = 0x1000;
export const delayedDueAt = (score: number) => Math.floor(score / DELAYED_SCORE_FACTOR);

/**
 * When a job (re)entered `wait`/`prioritized`. `timestamp` is the creation time and never moves,
 * so a job retried after a backoff would look as old as its first attempt. A retry re-enters at
 * about `processedOn` (start of the last attempt) + `delay` (the backoff, which BullMQ writes to
 * `delay`); a stalled job moved back re-enters after `processedOn`. A delayed first enqueue enters
 * at `timestamp + delay`. A retry really re-enters at failure time + backoff, so this overstates
 * its age by the last attempt's duration (seconds for these queues, far under `STUCK_AFTER_MS`).
 */
export function pendingSince(job: PendingJob): number {
  const delay = job.delay ?? 0;
  const lastAttempt = job.processedOn ? job.processedOn + ((job.attemptsMade ?? 0) > 0 ? delay : 0) : 0;
  return Math.max(job.timestamp + delay, lastAttempt);
}

/** Due time of a delayed job: the score when known, else the same estimate as `pendingSince`. */
export function delayedJobDueAt(job: DelayedJob): number {
  if (job.dueAt !== undefined) return job.dueAt;
  const delay = job.delay ?? 0;
  return Math.max(job.timestamp, job.processedOn ?? 0) + delay;
}

/** Pure: whether a queue has jobs nobody is picking up. */
export function evaluateQueue(snapshot: QueueSnapshot, now: number): QueueEvaluation {
  const overdue: { id: string; by: number }[] = [];

  let oldestPendingAgeMs: number | null = null;
  for (const job of snapshot.pending) {
    const age = now - pendingSince(job);
    if (oldestPendingAgeMs === null || age > oldestPendingAgeMs) oldestPendingAgeMs = age;
    if (age > STUCK_AFTER_MS) overdue.push({ id: String(job.id), by: age });
  }

  let oldestDelayedOverdueMs: number | null = null;
  for (const job of snapshot.delayed) {
    const pastDue = Math.max(0, now - delayedJobDueAt(job));
    if (oldestDelayedOverdueMs === null || pastDue > oldestDelayedOverdueMs) oldestDelayedOverdueMs = pastDue;
    if (pastDue > STUCK_AFTER_MS) overdue.push({ id: String(job.id), by: pastDue });
  }

  return {
    stuck: overdue.length > 0,
    oldestPendingAgeMs,
    oldestDelayedOverdueMs,
    stuckJobIds: overdue
      .sort((a, b) => b.by - a.by)
      .slice(0, MAX_LISTED_JOBS)
      .map(({ id }) => id),
  };
}

/** Pure: failed jobs that finished after the watermark, newest first. */
export function newFailedJobs<T extends Pick<Job, 'finishedOn'>>(failed: T[], watermark: number): T[] {
  return failed
    .filter((job) => (job.finishedOn ?? 0) > watermark)
    .sort((a, b) => (b.finishedOn ?? 0) - (a.finishedOn ?? 0));
}

/** Only the fields `evaluateQueue` reads: the snapshot never carries job `data`. */
const pick = (job: Job): DelayedJob => ({
  id: job.id,
  timestamp: job.timestamp,
  delay: job.delay,
  processedOn: job.processedOn,
  attemptsMade: job.attemptsMade,
});

/**
 * Job id -> due time for the earliest-due delayed jobs, from the delayed set's scores. Empty when
 * it cannot be read; the hash-based estimate in `delayedJobDueAt` then applies.
 */
async function readDelayedDueTimes(queue: Queue): Promise<Map<string, number>> {
  const dueTimes = new Map<string, number>();
  try {
    const client = await queue.backend.client;
    const flat = await client.zrange(queue.keys.delayed, 0, JOB_SAMPLE_SIZE - 1, { WITHSCORES: true });
    for (let i = 0; i + 1 < flat.length; i += 2) {
      const score = Number(flat[i + 1]);
      if (Number.isFinite(score)) dueTimes.set(flat[i], delayedDueAt(score));
    }
  } catch {
    // Estimate instead.
  }
  return dueTimes;
}

const toSeconds = (ms: number | null) => (ms === null ? null : Math.round(ms / 1000));

/**
 * Every minute, on one replica: alerts the admins when a monitored queue has jobs nobody consumes,
 * or new permanently failed jobs. The consumer watchdog restarts a replica whose workers are
 * visibly down; this is the backstop for a consumer that looks fine but no longer pulls jobs.
 *
 * Messages are constant per queue and environment, so the critical-alert dedup works: counts,
 * ages and ids go in extraInfo. Job `data` is never logged: Stripe events carry customer PII.
 */
@Injectable()
export class QueueStuckJobsTask {
  private readonly logger = apiLogger('queue-health');
  private readonly queues: Queue[];

  constructor(
    @InjectQueue(STRIPE_WEBHOOKS_QUEUE) stripeWebhooksQueue: Queue,
    @InjectQueue(PLAN_SUBSCRIPTIONS_QUEUE) planSubscriptionsQueue: Queue,
  ) {
    this.queues = [stripeWebhooksQueue, planSubscriptionsQueue];
  }

  /** Seam for specs. */
  protected now(): number {
    return Date.now();
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'queue-stuck-jobs', timeZone: 'UTC' })
  async handleQueueStuckJobs(): Promise<void> {
    // No audit lines: a healthy tick writes nothing, instead of three lines a minute.
    await runCronExclusive('queue-stuck-jobs', CRON_LOCK_TTL.minute, () => this.run(), { audit: false });
  }

  /** Never throws: one queue failing to answer does not skip the others. */
  async run(): Promise<void> {
    for (const queue of this.queues) {
      try {
        await this.checkStuck(queue);
        await this.checkFailed(queue);
      } catch (error) {
        this.logger.error('Queue health check failed', {
          queue: queue.name,
          error_message: error instanceof Error ? error.message : String(error),
          operation: 'stuck-jobs',
        });
      }
    }
  }

  private async checkStuck(queue: Queue): Promise<void> {
    const [counts, pending, delayed, dueTimes] = await Promise.all([
      queue.getJobCounts(...COUNTED_STATES),
      queue.getJobs(PENDING_STATES, 0, JOB_SAMPLE_SIZE - 1, true),
      queue.getDelayed(0, JOB_SAMPLE_SIZE - 1),
      readDelayedDueTimes(queue),
    ]);
    // A job removed between the id read and the hash read comes back empty.
    const snapshot: QueueSnapshot = {
      queue: queue.name,
      counts,
      pending: pending.filter(Boolean),
      delayed: delayed
        .filter(Boolean)
        .map((job) => ({ ...pick(job), dueAt: dueTimes.get(String(job.id)) })),
    };
    const evaluation = evaluateQueue(snapshot, this.now());
    if (!evaluation.stuck) return;

    const extraInfo = {
      queue: queue.name,
      counts,
      oldest_pending_age_s: toSeconds(evaluation.oldestPendingAgeMs),
      oldest_delayed_overdue_s: toSeconds(evaluation.oldestDelayedOverdueMs),
      job_ids: evaluation.stuckJobIds,
      ...environment(),
    };

    if (await this.inStuckCooldown(queue.name)) {
      this.logger.warn('Queue still stuck; alert in cooldown', { ...extraInfo, operation: 'stuck-jobs' });
      return;
    }
    this.logger.critical(`Queue "${queue.name}" has stuck jobs (${hostLabel()})`, {
      ...extraInfo,
      operation: 'stuck-jobs',
    });
  }

  /**
   * Takes the cooldown key, or reports it is already held. Independent of the critical-alert
   * throttle, which `ERROR_EMAIL_THROTTLE_MINUTES=0` turns off. Fails open: without Redis the
   * alert goes out, and the per-process critical throttle still applies.
   */
  private async inStuckCooldown(queueName: string): Promise<boolean> {
    try {
      const client = await getLockClient();
      if (!client) return false;
      const reply = await client.set(stuckAlertKey(queueName), '1', {
        condition: 'NX',
        expiration: { type: 'PX', value: STUCK_ALERT_COOLDOWN_MS },
      });
      return reply !== 'OK';
    } catch {
      return false;
    }
  }

  /**
   * Alerts once per batch of new permanent failures. The watermark is the newest `finishedOn`
   * already reported; without Redis there is no watermark, so this is skipped rather than
   * re-alerting the same failures every minute.
   */
  private async checkFailed(queue: Queue): Promise<void> {
    const client = await getLockClient();
    if (!client) return;

    const key = failedWatermarkKey(queue.name);
    const stored = Number(await client.get(key));
    if (!stored) {
      // First run: the existing failure history is not news.
      await client.set(key, String(this.now()));
      return;
    }

    const failed: FailedJob[] = (await queue.getFailed(0, JOB_SAMPLE_SIZE - 1)).filter(Boolean);
    const fresh = newFailedJobs(failed, stored);
    if (fresh.length === 0) return;

    await client.set(key, String(fresh[0].finishedOn ?? stored));
    this.logger.critical(
      `Queue "${queue.name}" has new failed jobs (${hostLabel()})`,
      {
        queue: queue.name,
        count: fresh.length,
        jobs: fresh.slice(0, MAX_LISTED_JOBS).map((job) => ({
          id: job.id,
          name: job.name,
          attempts_made: job.attemptsMade,
          finished_on: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
          failed_reason: maskEmailAddresses(String(job.failedReason ?? '')).slice(0, FAILED_REASON_MAX_LENGTH),
        })),
        ...environment(),
        operation: 'failed-jobs',
      },
    );
  }
}

/** `NODE_ENV` is `production` on both droplets; the app URL is what tells prod from dev. */
const environment = () => {
  const app = getConfigValue('app');
  return { app_url: app.url ?? null, app_env: app.env };
};

const hostLabel = () => {
  const app = getConfigValue('app');
  return displayHost(app.url) || app.env;
};
