import { config } from '@repo/common-lib/config';
import { JOB_PROCESS_MEDIA, MEDIA_QUEUE } from '@repo/common-lib/constants/queues';
import { DatabaseConfig } from '@repo/common-lib/types/database';
import { init, killClient } from '@repo/database';
import { Job, Worker } from 'bullmq';
import express from 'express';
import { MediaProcessor } from './processors/media.processor';

/**
 * How long a worker may hold a job before BullMQ assumes it died.
 *
 * Sized for the slowest thing on the queue - a full-length video transcode - not for the
 * average job, because the cost of being too low is a duplicate run of work that is not
 * safely repeatable, while the cost of being too high is only a delayed retry after a crash.
 */
const MEDIA_JOB_LOCK_MS = 10 * 60 * 1000;

async function bootstrap() {
    const appConfig = config();
    const WORKER_PORT = process.env.WORKER_PORT || 8081;
    const redisUrl = appConfig.redis.url;

    if (!redisUrl) {
        throw new Error('REDIS_URL is required to start the worker');
    }

    await init(appConfig.database as DatabaseConfig);

    const connection = { url: redisUrl };
    const app = express();

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'worker' });
    });

    const jobResolver: {
        [queue: string]: {
            [job: string]: (job: Job) => Promise<void>
        }
    } = {
        [MEDIA_QUEUE]: {
            [JOB_PROCESS_MEDIA]: (job) => MediaProcessor.handle(job),
        },
    };

    const workers = Object.keys(jobResolver).map((queue) =>
        new Worker(
            queue,
            async (job) => {
                const handler = jobResolver[queue]?.[job.name];
                if (typeof handler !== 'function') {
                    throw new Error(`Job name "${job.name}" not recognized for queue "${queue}"`);
                }
                await handler(job);
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

    const server = app.listen(WORKER_PORT, () => {
        console.log(`[worker] listening on port ${WORKER_PORT}`);
        console.log(`[worker] redis: ${redisUrl}`);
    });

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
