import { EnumType } from '../constants/enums';
import { UserNotificationSchema } from '../schemas/user-notification';
import { OffsetPaginationRequest } from './request';

export type UserNotification = Omit<UserNotificationSchema, 'created_at' | 'updated_at'>;

export type UserNotificationIndexRequest = OffsetPaginationRequest & {
  type?: EnumType<'NOTIFICATION_TYPE'>;
  unread?: boolean;
  entity_id?: number;
};

export type CreateUserNotificationInput = {
  type: EnumType<'NOTIFICATION_TYPE'>;
  user_id: number;
  entity_id: number;
  read_at: Date | null;
};

export type UpdateUserNotificationInput = Partial<
  Omit<CreateUserNotificationInput, 'type' | 'entity_id'>
>;
