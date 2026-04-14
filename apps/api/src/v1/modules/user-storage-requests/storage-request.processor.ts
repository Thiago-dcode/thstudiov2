import { Processor } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { UserStorageRequestRepository } from './user-storage-request.repository';
import { CreateUserStorageRequestEvent } from './events/create-user-storage-request.event';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { CreateUserStorageRequestInput } from '@repo/common-lib/types/user-storage-request';
import {
  CREATE_USER_STORAGE_REQUEST,
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
    @InjectQueue(STORAGE_REQUESTS_QUEUE) private readonly storageQueue: Queue,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  // ==================== EVENT LISTENERS ====================

  /** Listen for storage request events and enqueue them */
  @OnEvent(CREATE_USER_STORAGE_REQUEST)
  async handleCreateStorageRequestEvent(event: CreateUserStorageRequestEvent) {
    await this.storageQueue.add(
      JOB_CREATE_STORAGE_REQUEST,
      event.storageRequest,
      {
        jobId: `storage-${event.storageRequest.user_id}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
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

