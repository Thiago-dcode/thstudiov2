import { config } from '@repo/common-lib/config';
import {
    BACKUP_QUEUE,
    JOB_DATABASE_BACKUP,
    JOB_PROCESS_MEDIA,
    JOB_REGENERATE_MEDIA_THUMBNAIL,
    JOB_SET_VIDEO_THUMBNAIL,
    JOB_DELETE_REPLACED_MEDIA_OBJECT,
    MEDIA_QUEUE,
    MEDIA_THUMBNAIL_QUEUE,
} from '@repo/common-lib/constants/queues';
import { DatabaseConfig } from '@repo/common-lib/types/database';
import { getClient, init, killClient } from '@repo/database';
import { Job, Queue, Worker } from 'bullmq';
import express from 'express';
import { BackupProcessor } from './processors/backup.processor';
import { MediaProcessor } from './processors/media.processor';

/**
 * How long a worker may hold a job before BullMQ assumes it died.
 *
 * Sized for the slowest thing on the queue - a full-length video transcode - not for the
 * average job, because the cost of being too low is a duplicate run of work that is not
 * safely repeatable, while the cost of being too high is only a delayed retry after a crash.
 */
const MEDIA_JOB_LOCK_MS = 10 * 60 * 1000;

type Connection = { url: string };
type JobResolver = Record<string, Record<string, (job: Job) => Promise<unknown>>>;

const jobResolver: JobResolver = {
    [MEDIA_QUEUE]: {
        [JOB_PROCESS_MEDIA]: (job) => MediaProcessor.handle(job),
    },
    [MEDIA_THUMBNAIL_QUEUE]: {
        [JOB_REGENERATE_MEDIA_THUMBNAIL]: (job) => MediaProcessor.handle(job),
        [JOB_SET_VIDEO_THUMBNAIL]: (job) => MediaProcessor.handle(job),
        [JOB_DELETE_REPLACED_MEDIA_OBJECT]: (job) => MediaProcessor.handle(job),
    },
    [BACKUP_QUEUE]: {
        [JOB_DATABASE_BACKUP]: () => BackupProcessor.handle(),
    },
};

/** Runs `configure` against a short-lived handle on `queueName`, always closing it afterwards. */
async function withQueue(connection: Connection, queueName: string, configure: (queue: Queue) => Promise<unknown>) {
    const queue = new Queue(queueName, { connection });
    try {
        await configure(queue);
    } finally {
        await queue.close();
    }
}

/**
 * One thumbnail at a time across ALL worker instances: a per-Worker concurrency of 1 would not
 * stop a second instance from picking up the next job. Stored in Redis, so it is idempotent.
 */
const limitThumbnailConcurrency = (connection: Connection) =>
    withQueue(connection, MEDIA_THUMBNAIL_QUEUE, (queue) => queue.setGlobalConcurrency(1));

/**
 * upsertJobScheduler is idempotent (keyed by id, stored in Redis), so every worker instance and every
 * restart can call it without duplicating the schedule. The backup itself no-ops outside production.
 */
const scheduleDatabaseBackup = (connection: Connection) =>
    withQueue(connection, BACKUP_QUEUE, (queue) =>
        queue.upsertJobScheduler(
            JOB_DATABASE_BACKUP,
            { pattern: config().backup.cron, tz: 'UTC' },
            {
                name: JOB_DATABASE_BACKUP,
                opts: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5 * 60 * 1000 },
                    removeOnComplete: 30,
                    removeOnFail: 30,
                },
            },
        ),
    );

const createWorkers = (connection: Connection) =>
    Object.keys(jobResolver).map((queue) =>
        new Worker(
            queue,
            async (job) => {
                const handler = jobResolver[queue]?.[job.name];
                if (typeof handler !== 'function') {
                    throw new Error(`Job name "${job.name}" not recognized for queue "${queue}"`);
                }
                // Returned so BullMQ stores it as the job's return value (read by `dbcli db:backup`).
                return handler(job);
            },
            {
                connection,
                // BullMQ's default lock is 30s, renewed on a timer. Media jobs run far longer than
                // that - a 27MB upload took ~80s - and the renewal timer competes with sharp and
                // ffmpeg for the event loop, so the lock lapsed, the job was treated as stalled and
                // redelivered while the first attempt was still working. A lock that outlives a
                // realistic transcode removes that race; a genuinely dead worker still releases its
                // jobs, just after this window rather than after 30s.
                lockDuration: MEDIA_JOB_LOCK_MS,
                stalledInterval: MEDIA_JOB_LOCK_MS,
            },
        ),
    );

/** Upper bound for each dependency probe, so a hung connection fails the check instead of stalling it. */
const HEALTH_CHECK_TIMEOUT_MS = 3000;

/** Rejects if `probe` has not settled within `ms`; always clears its timer. */
async function withTimeout<T>(probe: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
        return await Promise.race([
            probe,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}

type HealthCheck = 'ok' | 'fail';

/**
 * Probes what the worker actually needs to do its job: Redis (where it pulls jobs from),
 * Postgres (where processors write results) and its own BullMQ workers still consuming.
 * Failure detail is logged, never returned: this answers probes, it is not a debugging API.
 */
async function runHealthChecks(workers: Worker[]): Promise<Record<'redis' | 'database' | 'workers', HealthCheck>> {
    const probe = async (label: string, fn: () => Promise<unknown>): Promise<HealthCheck> => {
        try {
            await withTimeout(fn(), HEALTH_CHECK_TIMEOUT_MS, label);
            return 'ok';
        } catch (error) {
            console.error(`[worker] health: ${label} check failed:`, error instanceof Error ? error.message : error);
            return 'fail';
        }
    };

    const [redis, database, running] = await Promise.all([
        probe('redis', async () => {
            // The worker's own connection, not a side channel. `status` alone is not enough: it stays
            // 'ready' while the socket is open, so a frozen Redis (paused, stuck in a long script)
            // still reads 'ready'. It is the fast path; the read below proves Redis actually answers.
            const client = await workers[0]?.backend.client;
            if (!client) throw new Error('no worker redis client');
            if (client.status !== 'ready') throw new Error(`redis connection is "${client.status}"`);
            await client.get('worker:health-probe'); // read-only round trip on a key that never exists
        }),
        probe('database', () => getClient().query('SELECT 1')),
        probe('workers', async () => {
            if (workers.length === 0 || !workers.every((worker) => worker.isRunning())) {
                throw new Error('a BullMQ worker is not running');
            }
        }),
    ]);

    return { redis, database, workers: running };
}

const startHealthServer = (port: number | string, redisUrl: string, workers: Worker[]) => {
    const app = express();

    app.get('/health', async (_req, res) => {
        const checks = await runHealthChecks(workers);
        const healthy = Object.values(checks).every((check) => check === 'ok');
        // 503, not 200: the compose healthcheck treats any non-ok response as unhealthy.
        res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'unhealthy', service: 'worker', checks });
    });

    return app.listen(port, () => {
        console.log(`[worker] listening on port ${port}`);
        console.log(`[worker] redis: ${redisUrl}`);
    });
};

async function bootstrap() {
    const appConfig = config();
    const redisUrl = appConfig.redis.url;

    if (!redisUrl) {
        throw new Error('REDIS_URL is required to start the worker');
    }

    await init(appConfig.database as DatabaseConfig);

    const connection = { url: redisUrl };

    await limitThumbnailConcurrency(connection);
    await scheduleDatabaseBackup(connection);

    const workers = createWorkers(connection);
    const server = startHealthServer(process.env.WORKER_PORT || 8081, redisUrl, workers);

    async function shutdown() {
        console.log('[worker] shutting down...');
        await Promise.all(workers.map((worker) => worker.close()));
        await killClient();
        server.close();
        process.exit(0);
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

void bootstrap();
