import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

const failedJobLogger = FactoryLogService.createLogService('file', {
  channel: 'failed-job',
});

/** Email bodies carry live recovery and 2FA codes: log their size, never their content. */
const BODY_KEYS = new Set(['html', 'text']);

export const redactJobData = (data: unknown): unknown => {
  if (Array.isArray(data)) return data.map(redactJobData);
  if (!data || typeof data !== 'object') return data;
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([key, value]) => [
      key,
      BODY_KEYS.has(key) && typeof value === 'string'
        ? `[redacted, ${value.length} chars]`
        : redactJobData(value),
    ]),
  );
};

export abstract class GlobalProcessor extends WorkerHost {
  @OnWorkerEvent('failed')
  async onFailed(
    job: Job | undefined,
    error: Error,
    prev: string,
  ): Promise<void> {
    if (!job) {
      failedJobLogger.error('Queue worker failed with no job', {
        message: error?.message,
        stack: error?.stack,
        prev,
      });
      await LogService.flush();
      return;
    }

    const maxAttempts = Math.max(1, job.opts.attempts ?? 1);
    if (job.attemptsMade < maxAttempts) {
      return;
    }

    const queueLabel =
      job.queueQualifiedName?.replace(/^[^:]+:/, '') ?? 'unknown';

    failedJobLogger.name(queueLabel).error(
      `Job failed permanently: ${queueLabel} / ${String(job.name)} (${String(job.id)})`,
      {
        queue: queueLabel,
        queueQualifiedName: job.queueQualifiedName,
        jobId: job.id,
        jobName: job.name,
        data: redactJobData(job.data),
        attemptsMade: job.attemptsMade,
        maxAttempts,
        failedReason: job.failedReason ?? error?.message,
        errorMessage: error?.message,
        errorStack: error?.stack,
        stacktrace: job.stacktrace,
        prev,
      },
    );
    await LogService.flush();
  }
}
