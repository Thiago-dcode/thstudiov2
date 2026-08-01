import { config } from '@repo/common-lib/config';
import express from 'express';
import { Job, Queue, Worker } from 'bullmq';
const appConfig = config();
const WORKER_PORT = process.env.WORKER_PORT || 8081;

const app = express();

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'worker' });
});

// TODO: Register workers here
// Example:
const myWorker = new Worker('queue-name', async (job: Job) => {

  JobStrategyFactory.resolve(job)

});

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



abstract class JobStrategy {

  constructor(public readonly job: Job) { }

  abstract handle(): Promise<any>

}


class VideoProcessStrategy extends JobStrategy {



  async handle() {

  }
}


class JobStrategyFactory {



  static async resolve(job: Job) {



    switch (job.name) {
      case 'video':

        return (new VideoProcessStrategy(job)).handle()

      default:
    }


  }
}

