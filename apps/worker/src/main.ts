import { logBuffer, logConfig, setLogProcessService } from '@repo/backend-lib/config/logging';
import { config } from '@repo/common-lib/config';
import { MEDIA_THUMBNAIL_QUEUE } from '@repo/common-lib/constants/queues';
import { DatabaseConfig } from '@repo/common-lib/types/database';
import { getClient, init, killClient } from '@repo/database';
import { Worker } from 'bullmq';
import express from 'express';
import { logPermanentJobFailure, withTimeout } from '@repo/backend-lib/utils';
import { jobResolver, runWorkerJob } from './job-runner';
import { Connection, scheduleDatabaseBackup, scheduleLogFlush, withQueue } from './schedulers';

// Before anything logs: every line of this process, backend-lib's own included, goes under `worker/`.
// The service is read per line, so loggers built at import time pick it up too.
setLogProcessService('worker');

/**
 * How long a worker may hold a job before BullMQ assumes it died.
 *
 * Sized for the slowest thing on the queue - a full-length video transcode - not for the
 * average job, because the cost of being too low is a duplicate run of work that is not
 * safely repeatable, while the cost of being too high is only a delayed retry after a crash.
 */
const MEDIA_JOB_LOCK_MS = 10 * 60 * 1000;

/** Upper bound for settling the log buffer on shutdown, so a stuck push can't hold the exit. */
const SETTLE_LOGS_TIMEOUT_MS = 5000;

/**
 * One thumbnail at a time across ALL worker instances: a per-Worker concurrency of 1 would not
 * stop a second instance from picking up the next job. Stored in Redis, so it is idempotent.
 */
const limitThumbnailConcurrency = (connection: Connection) =>
    withQueue(connection, MEDIA_THUMBNAIL_QUEUE, (queue) => queue.setGlobalConcurrency(1));

const createWorkers = (connection: Connection) =>
    Object.keys(jobResolver).map((queue) => {
        const worker = new Worker(
            queue,
            // Inside the job's trace context, with start/completed/retry lines (see job-runner).
            (job) => runWorkerJob(queue, job),
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
        );
        // The worker had no permanent-failure line at all; this is the same one api jobs get.
        worker.on('failed', (job, error, prev) => void logPermanentJobFailure(job, error, prev, logConfig.worker));
        return worker;
    });

/** Upper bound for each dependency probe, so a hung connection fails the check instead of stalling it. */
const HEALTH_CHECK_TIMEOUT_MS = 3000;

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
    await scheduleLogFlush(connection);

    const workers = createWorkers(connection);
    const server = startHealthServer(process.env.WORKER_PORT || 8081, redisUrl, workers);

    async function shutdown() {
        console.log('[worker] shutting down...');
        await Promise.all(workers.map((worker) => worker.close()));
        // Never a flush: the lines stay in Redis for the next scheduled run (on any instance).
        await withTimeout(logBuffer.settle(), SETTLE_LOGS_TIMEOUT_MS, 'settle logs').catch((error) =>
            console.error('[worker] settling logs failed:', error instanceof Error ? error.message : error),
        );
        await killClient();
        server.close();
        process.exit(0);
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

void bootstrap();
