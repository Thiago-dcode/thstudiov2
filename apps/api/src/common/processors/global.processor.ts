import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  logPermanentJobFailure,
  readJobTrace,
  redactJobData,
  runJobWithLogs,
} from '@repo/backend-lib/utils';
import { runWithTraceId } from 'src/common/services/request-storage';
import { apiTraceCarrier } from 'src/common/services/request.service';

/** Kept for the specs that import it from here; the implementation lives in backend-lib. */
export { redactJobData };

export abstract class GlobalProcessor extends WorkerHost {
  constructor() {
    super();
    // Every api job runs in its own request store whose trace id is the enqueuer's (or a fresh
    // one), so the DI loggers and the jobs it enqueues share it, with start/completed/retry
    // lines. Nest's explorer binds `instance.process` after construction, so it picks this up.
    if (typeof this.process !== 'function') return;
    const original = this.process.bind(this) as (job: Job, token?: string) => Promise<unknown>;
    this.process = (job: Job, token?: string) =>
      runWithTraceId(readJobTrace(job)?.id ?? randomUUID(), () =>
        runJobWithLogs(job, () => original(job, token), { log: apiTraceCarrier() }),
      );
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job | undefined,
    error: Error,
    prev: string,
  ): Promise<void> {
    // Final attempt or UnrecoverableError: one `failed-job` line, with the job's trace id.
    await logPermanentJobFailure(job, error, prev, apiTraceCarrier());
  }
}
