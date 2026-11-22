import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  JOB_CREATE_OR_UPDATE_USER_NOTIFICATION,
  USER_NOTIFICATIONS_QUEUE,
} from '@repo/common-lib/constants/queues';
import type {
  CreateUserNotificationInput,
  UserNotificationRow,
} from '@repo/common-lib/types/user-notification';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { UserNotificationsRepository } from './user-notifications.repository';
import { UserNotificationsService } from './user-notifications.service';
import { UserNotificationsGateway } from './user-notifications.gateway';
import { apiLogger } from 'src/common/services/request.service';

@Processor(USER_NOTIFICATIONS_QUEUE)
export class UserNotificationsProcessor extends GlobalProcessor {
  constructor(
    private readonly userNotificationsRepository: UserNotificationsRepository,
    private readonly userNotificationsService: UserNotificationsService,
    private readonly userNotificationGateway: UserNotificationsGateway
  ) {
    super();
  }

  async process(job: Job<CreateUserNotificationInput>): Promise<unknown> {

    switch (job.name) {
      case JOB_CREATE_OR_UPDATE_USER_NOTIFICATION:
        return await this.createOrUpdateUserNotification(job.data);

      default:
        throw new Error(`Job name "${job.name}" not recognized`);
    }
  }

  private async createOrUpdateUserNotification(data: CreateUserNotificationInput) {
    const log = apiLogger('user-notifications', { operation: JOB_CREATE_OR_UPDATE_USER_NOTIFICATION });
    try {
      let userNotification = await this.userNotificationsRepository.findByTypeAndEntityId(
        data.type,
        data.entity_id,
      );

      if (userNotification) {
        userNotification = await this.userNotificationsRepository.updateById(
          userNotification.id,
          {
            user_id: data.user_id,
            read_at: data.read_at,
          },
        );
        // The entity is what triggered this rewrite, so its cached preview is now stale.
        await this.userNotificationsService.invalidatePayload(
          userNotification.id,
        );
        log.info(
          `User notification updated: type=${data.type} entity_id=${data.entity_id}`,
          {
            id: userNotification.id,
            user_id: data.user_id,
            type: data.type,
            entity_id: data.entity_id,
          },
        );
        await this.notifyUser(userNotification);
        return userNotification;
      }

      userNotification = await this.userNotificationsRepository.create(data);
      log.info(
        `User notification created: type=${data.type} entity_id=${data.entity_id}`,
        {
          id: userNotification.id,
          user_id: data.user_id,
          type: data.type,
          entity_id: data.entity_id,
        },
      );
      await this.notifyUser(userNotification);
      return userNotification;

    } catch (error) {
      log.error(
        `Failed to create or update user notification: type=${data.type} entity_id=${data.entity_id} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }

  }

  /**
   * Pushes the notification with its entity payload attached, so a live card renders the same
   * content it would after a reload instead of waiting for a refetch.
   */
  private async notifyUser(row: UserNotificationRow): Promise<void> {
    const [userNotification] = await this.userNotificationsService.getPayload([
      row,
    ]);
    await this.userNotificationGateway.notifyUser(userNotification);
  }
}
