import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UserStorageRequestRepository } from './user-storage-request.repository';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { CreateUserStorageRequestInput } from '@repo/common-lib/types/user-storage-request';
import {
  STORAGE_REQUESTS_QUEUE,
  JOB_CREATE_STORAGE_REQUEST,
} from '@repo/common-lib/constants/constants';
import { GlobalProcessor } from 'src/common/processors/global.processor';

@Processor(STORAGE_REQUESTS_QUEUE)
export class StorageRequestProcessor extends GlobalProcessor {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'user-storage-requests',
  });

  constructor(
    private readonly userStorageRequestRepository: UserStorageRequestRepository,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  // ==================== JOB PROCESSOR ====================

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case JOB_CREATE_STORAGE_REQUEST:
          return await this.createStorageRequest(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.appLogService.flushAsync();
    }
  }

  // ==================== JOB HANDLERS ====================

  private async createStorageRequest(data: CreateUserStorageRequestInput) {
    const log = this.logger.name('create-storage-request');
    try {
      const storageRequest = await this.userStorageRequestRepository.create(data);
      log.info(
        `Storage request created: ${data.path} (${data.bytes} bytes)`,
        {
          user_id: data.user_id,
          path: data.path,
          bytes: data.bytes,
        },
      );

      return storageRequest;
    } catch (error) {
      log.error(
        `Failed to create storage request: ${data.path} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}

