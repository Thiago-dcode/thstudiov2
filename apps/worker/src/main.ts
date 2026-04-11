import { config } from '@repo/common-lib/config';
import express from 'express';
import { Worker } from 'bullmq';

const appConfig = config();
const WORKER_PORT = process.env.WORKER_PORT || 8081;

const redisConnection = { url: appConfig.redis.url };

const app = express();

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'worker' });
});

// TODO: Register workers here
// Example:
// const myWorker = new Worker('queue-name', async (job) => {
//   console.log(`Processing job ${job.id} - ${job.name}`, job.data);
// }, { connection: redisConnection });

const server = app.listen(WORKER_PORT, () => {
  console.log(`[worker] listening on port ${WORKER_PORT}`);
  console.log(`[worker] redis: ${appConfig.redis.url}`);
});

async function shutdown() {
  console.log('[worker] shutting down...');
  server.close();
  // TODO: close all registered workers here
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
