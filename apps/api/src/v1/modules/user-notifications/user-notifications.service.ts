import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateUserNotificationInput,
  UserNotification,
} from '@repo/common-lib/types/user-notification';
import { IndexUserNotificationRequest } from './requests/index-user-notification.request';
import { UserNotificationsRepository } from './user-notifications.repository';

@Injectable()
export class UserNotificationsService {
  constructor(
    private readonly userNotificationsRepository: UserNotificationsRepository,
  ) {}

  async create(data: CreateUserNotificationInput): Promise<UserNotification> {
    return this.userNotificationsRepository.create(data);
  }

  async getAll(
    userId: number,
    filters: IndexUserNotificationRequest,
  ): Promise<UserNotification[]> {
    return this.userNotificationsRepository.getAll(userId, filters);
  }

  async getOne(id: number, userId: number): Promise<UserNotification> {
    const notification = await this.userNotificationsRepository.getOne(id);
    if (!notification || notification.user_id !== userId) {
      throw new NotFoundException(`User notification with ID ${id} not found`);
    }
    return notification;
  }
}
