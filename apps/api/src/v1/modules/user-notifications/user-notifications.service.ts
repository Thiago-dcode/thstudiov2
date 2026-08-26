import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CACHE_KEY_USER_NOTIFICATION_PAYLOAD,
  USER_NOTIFICATION_PAYLOAD_CACHE_TTL,
} from '@repo/common-lib/constants/cache';
import type { EnumType } from '@repo/common-lib/constants/enums';
import { CACHEABLE_MEDIA_STATUSES } from '@repo/common-lib/constants/user-notification';
import type { UserContactSchema } from '@repo/common-lib/schemas/user-contact';
import type { Media } from '@repo/common-lib/types/media';
import type {
  CreateUserNotificationInput,
  NewContactNotificationPayload,
  UserNotification,
  UserNotificationRow,
} from '@repo/common-lib/types/user-notification';
import { Helpers } from 'src/common/services/helpers.service';
import { MediaRepository } from '../media/media.repository';
import { UserContactsRepository } from '../user-contacts/user-contacts.repository';
import { IndexUserNotificationRequest } from './requests/index-user-notification.request';
import { UserNotificationsRepository } from './user-notifications.repository';

/** The entities a batch of notifications points at, read once per `getPayload` call. */
type PayloadSources = {
  contacts: Map<number, UserContactSchema>;
  media: Map<number, Media>;
};

/**
 * Which table each notification's `entity_id` refers to. Exhaustive over `NOTIFICATION_TYPE`, so a
 * new value has to say where its entity is read from before this compiles.
 */
const ENTITY_SOURCE: Record<
  EnumType<'NOTIFICATION_TYPE'>,
  keyof PayloadSources
> = {
  NEW_CONTACT: 'contacts',
  CREATE_UPDATE_MEDIA: 'media',
  GENERATE_MEDIA_METADATA: 'media',
};

/**
 * A contact is the one entity that does not travel whole: its message body is the bulk of the
 * row and a card never shows it, so only the header goes into the payload.
 */
const toContactPayload = (
  contact: UserContactSchema,
): NewContactNotificationPayload => ({
  id: contact.id,
  contact_name: contact.contact_name,
  contact_email: contact.contact_email,
  subject: contact.subject,
});

@Injectable()
export class UserNotificationsService {
  constructor(
    private readonly userNotificationsRepository: UserNotificationsRepository,
    private readonly userContactsRepository: UserContactsRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly helpers: Helpers,
  ) {}

  async create(data: CreateUserNotificationInput): Promise<UserNotificationRow> {
    return this.userNotificationsRepository.create(data);
  }

  async getAll(
    userId: number,
    filters: IndexUserNotificationRequest,
  ): Promise<UserNotification[]> {
    const rows = await this.userNotificationsRepository.getAll(userId, filters);
    return this.getPayload(rows);
  }

  async getOne(id: number, userId: number): Promise<UserNotification> {
    const notification = await this.userNotificationsRepository.getOne(id);
    if (!notification || notification.user_id !== userId) {
      throw new NotFoundException(`User notification with ID ${id} not found`);
    }
    const [withPayload] = await this.getPayload([notification]);
    return withPayload;
  }

  /**
   * Attaches each row's entity payload, cached per notification for
   * `USER_NOTIFICATION_PAYLOAD_CACHE_TTL` and dropped by `invalidatePayload` whenever the
   * notification is rewritten. Entities missing from the cache are resolved in one query per
   * table, so a page of notifications never turns into a query per row.
   */
  async getPayload(rows: UserNotificationRow[]): Promise<UserNotification[]> {
    if (!rows.length) return [];

    // Resolved at most once per call, and only if some row misses the cache: a fully cached page
    // reads no table at all.
    let sources: Promise<PayloadSources> | null = null;
    const resolveSources = () => (sources ??= this.loadSources(rows));

    return await Promise.all(
      rows.map(async (row) => {
        const cached = await this.helpers.cacheRemember<UserNotification>(
          CACHE_KEY_USER_NOTIFICATION_PAYLOAD(row.id),
          async () => this.build(row, await resolveSources()),
          { ttl: USER_NOTIFICATION_PAYLOAD_CACHE_TTL },
        );

        // A payload for an entity that is still being processed only describes this instant, so
        // the key is dropped again and the next read rebuilds it - otherwise a media that finished
        // uploading a second later would keep reporting `UPLOADING` for the whole TTL.
        if (!this.isCacheable(cached)) {
          await this.invalidatePayload(row.id);
        }

        // Only the payload is meant to be cached: `read_at` and `updated_at` are overwritten with
        // the row we just read, which also repairs the `Date`s that JSON round-tripping flattened
        // into strings. A media payload keeps its own dates as strings, which is what a client
        // would have received anyway - responses and socket frames are JSON either way.
        return Object.assign(cached, row);
      }),
    );
  }

  /** Drops a notification's cached payload so the next read rebuilds it from its entity. */
  async invalidatePayload(notificationId: number): Promise<void> {
    await this.helpers.deleteCached(
      CACHE_KEY_USER_NOTIFICATION_PAYLOAD(notificationId),
    );
  }

  private build(
    row: UserNotificationRow,
    { contacts, media }: PayloadSources,
  ): UserNotification {
    switch (row.type) {
      case 'NEW_CONTACT': {
        // Null payload: the entity was deleted after the notification was written.
        const contact = contacts.get(row.entity_id);
        return {
          ...row,
          type: row.type,
          payload: contact ? toContactPayload(contact) : null,
        };
      }
      case 'CREATE_UPDATE_MEDIA':
      case 'GENERATE_MEDIA_METADATA':
        return {
          ...row,
          type: row.type,
          payload: media.get(row.entity_id) ?? null,
        };
      default: {
        // Exhaustive: a new `NOTIFICATION_TYPE` has to be given a payload above before it compiles.
        const unsupported: never = row.type;
        throw new Error(
          `No payload defined for notification type "${String(unsupported)}"`,
        );
      }
    }
  }

  private async loadSources(
    rows: UserNotificationRow[],
  ): Promise<PayloadSources> {
    const ids: Record<keyof PayloadSources, Set<number>> = {
      contacts: new Set(),
      media: new Set(),
    };
    for (const row of rows) {
      ids[ENTITY_SOURCE[row.type]].add(row.entity_id);
    }

    // `findManyByIds` short-circuits on an empty list, so a page of one kind hits one table.
    const [contacts, media] = await Promise.all([
      this.userContactsRepository.findManyByIds([...ids.contacts]),
      this.mediaRepository.findManyByIds([...ids.media]),
    ]);

    return {
      contacts: new Map(contacts.map((contact) => [contact.id, contact])),
      media: new Map(media.map((entity) => [entity.id, entity])),
    };
  }

  /**
   * Whether a payload is final enough to keep. Only media payloads have a lifecycle; a contact
   * preview is settled the moment it is written.
   */
  private isCacheable({ payload }: UserNotification): boolean {
    if (!payload || !('status' in payload)) return true;
    return CACHEABLE_MEDIA_STATUSES.includes(payload.status);
  }
}
