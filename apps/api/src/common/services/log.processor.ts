import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import {
  LOG_QUEUE,
  JOB_FLUSH_LOGS,
} from '@repo/common-lib/constants/constants';
import { GlobalProcessor } from 'src/common/processors/global.processor';

@Processor(LOG_QUEUE)
export class LogProcessor extends GlobalProcessor {

  async process(job: Job): Promise<any> {
    try {
      console.log(`[LogProcessor] Received job: ${job.name} (id: ${job.id})`);
      switch (job.name) {
        case JOB_FLUSH_LOGS:
          return await this.flushLogs();

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
    }
  }

  private async flushLogs() {
    console.log('[LogProcessor] Starting log flush...');
    try {
      await LogService.flush();
      console.log('[LogProcessor] Log flush completed successfully');
    } catch (error) {
      console.error('[LogProcessor] Failed to flush logs:', error);
      throw error;
    }
  }
}
