import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import {
  JOB_CREATE_OR_UPDATE_USER_NOTIFICATION,
  USER_NOTIFICATIONS_QUEUE,
} from '@repo/common-lib/constants/constants';
import type { CreateUserNotificationInput } from '@repo/common-lib/types/user-notification';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { UserNotificationsRepository } from './user-notifications.repository';

@Processor(USER_NOTIFICATIONS_QUEUE)
export class UserNotificationsProcessor extends GlobalProcessor {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'user-notifications',
  });

  constructor(
    private readonly userNotificationsRepository: UserNotificationsRepository,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  async process(job: Job<CreateUserNotificationInput>): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_CREATE_OR_UPDATE_USER_NOTIFICATION:
          return await this.createOrUpdateUserNotification(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.appLogService.flushAsync();
    }
  }

  private async createOrUpdateUserNotification(data: CreateUserNotificationInput) {
    const log = this.logger.name(JOB_CREATE_OR_UPDATE_USER_NOTIFICATION);
    try {
      const existing = await this.userNotificationsRepository.findByTypeAndEntityId(
        data.type,
        data.entity_id,
      );

      if (existing) {
        const updated = await this.userNotificationsRepository.updateById(
          existing.id,
          {
            user_id: data.user_id,
            read_at: data.read_at,
          },
        );
        log.info(
          `User notification updated: type=${data.type} entity_id=${data.entity_id}`,
          {
            id: updated.id,
            user_id: data.user_id,
            type: data.type,
            entity_id: data.entity_id,
          },
        );
        return updated;
      }

      const created = await this.userNotificationsRepository.create(data);
      log.info(
        `User notification created: type=${data.type} entity_id=${data.entity_id}`,
        {
          id: created.id,
          user_id: data.user_id,
          type: data.type,
          entity_id: data.entity_id,
        },
      );
      return created;
    } catch (error) {
      log.error(
        `Failed to create or update user notification: type=${data.type} entity_id=${data.entity_id} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}
