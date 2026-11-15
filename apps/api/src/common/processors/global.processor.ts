import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LOG_QUEUE } from '@repo/common-lib/constants/queues';
import {
  logPermanentJobFailure,
  redactJobData,
  runJobWithLogContext,
} from '@repo/backend-lib/utils';

/** Kept for the specs that import it from here; the implementation lives in backend-lib. */
export { redactJobData };

export abstract class GlobalProcessor extends WorkerHost {
  constructor() {
    super();
    // Every api job runs inside its trace context (the id of whoever enqueued it) with
    // start/completed/retry lines. Nest's explorer binds `instance.process` after construction,
    // so it picks up this wrapper. The log-flush queue itself gets the context but no lines.
    if (typeof this.process !== 'function') return;
    const original = this.process.bind(this) as (job: Job, token?: string) => Promise<unknown>;
    this.process = (job: Job, token?: string) =>
      runJobWithLogContext(job, () => original(job, token), {
        lifecycle: job?.queueName !== LOG_QUEUE,
      });
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job | undefined,
    error: Error,
    prev: string,
  ): Promise<void> {
    // Final attempt or UnrecoverableError: one `failed-job` line, inside the job's trace.
    await logPermanentJobFailure(job, error, prev);
  }
}
