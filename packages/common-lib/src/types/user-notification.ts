import { EnumType } from '../constants/enums';
import { USER_NOTIFICATION_ORDER_BY_COLUMNS } from '../constants/user-notification';
import { UserNotificationSchema } from '../schemas/user-notification';
import { SqlOrderDirection } from './database';
import { Media } from './media';
import { OffsetPaginationRequest } from './request';

/**
 * A notification row as stored: it only points at an entity through `type` + `entity_id`.
 * Repositories return this; the service turns it into a `UserNotification` by attaching the
 * payload for that entity.
 */
export type UserNotificationRow = Omit<UserNotificationSchema, 'created_at'>;

type UserNotificationBase = Omit<UserNotificationRow, 'type'>;

// ==================== PAYLOADS ====================

/**
 * `entity_id` -> `user_contacts.id`
 *
 * A preview rather than the row: the message body is what makes a contact big, and it stays
 * behind the contacts endpoint.
 */
export type NewContactNotificationPayload = {
  id: number;
  contact_name: string;
  contact_email: string;
  subject: string;
};

/**
 * `payload` is null when the entity was deleted after the notification was written - consumers
 * must handle it, which is why it is part of the type instead of being silently omitted.
 */
type UserNotificationOf<
  Type extends EnumType<'NOTIFICATION_TYPE'>,
  Payload,
> = UserNotificationBase & {
  type: Type;
  payload: Payload | null;
};

export type NewContactNotification = UserNotificationOf<
  'NEW_CONTACT',
  NewContactNotificationPayload
>;

/**
 * Both media notifications carry `entity_id` -> `media.id` as the whole record: a media row is
 * already preview-sized, and a card renders around fields spread across it - `status`/
 * `failed_reason` for what happened, `thumbnail`/`shape` for how it looks, `seo_title`/
 * `seo_description` for what was generated.
 */
export type CreateUpdateMediaNotification = UserNotificationOf<
  'CREATE_UPDATE_MEDIA',
  Media
>;
export type GenerateMediaMetadataNotification = UserNotificationOf<
  'GENERATE_MEDIA_METADATA',
  Media
>;

/**
 * Discriminated on `type`: narrowing a `UserNotification` by its type also narrows `payload`,
 * so a card/handler written for one type cannot read another type's fields.
 */
export type UserNotification =
  | NewContactNotification
  | CreateUpdateMediaNotification
  | GenerateMediaMetadataNotification;

/** Picks the member(s) of the union for the given type(s), e.g. for component/handler props. */
export type UserNotificationOfType<T extends UserNotification['type']> =
  Extract<UserNotification, { type: T }>;

/** The notifications whose `entity_id` points at a media record. */
export type MediaNotification = UserNotificationOfType<
  'CREATE_UPDATE_MEDIA' | 'GENERATE_MEDIA_METADATA'
>;

export type UserNotificationOrderBy =
  (typeof USER_NOTIFICATION_ORDER_BY_COLUMNS)[number];

export type UserNotificationIndexRequest = OffsetPaginationRequest & {
  type?: EnumType<'NOTIFICATION_TYPE'>;
  unread?: boolean;
  entity_id?: number;
  /** ISO date-times; both bounds are inclusive and filter on `created_at`. */
  created_from?: string;
  created_to?: string;
  order_by?: UserNotificationOrderBy;
  order?: SqlOrderDirection;
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
