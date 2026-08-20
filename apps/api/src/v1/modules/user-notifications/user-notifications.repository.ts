import { Injectable } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import {
  UserNotificationSchemaColumns,
  UserNotificationSchemaWithoutTimestamps,
} from '@repo/common-lib/schemas/user-notification';
import {
  CreateUserNotificationInput,
  UpdateUserNotificationInput,
  UserNotification,
} from '@repo/common-lib/types/user-notification';
import { DbException } from '@repo/database/exceptions';
import { BaseRepository } from '@repo/database/repositories';
import { RequestService } from 'src/common/services/request.service';
import { IndexUserNotificationRequest } from './requests/index-user-notification.request';

@Injectable()
export class UserNotificationsRepository extends BaseRepository {
  private readonly COLUMNS: UserNotificationSchemaColumns[] = [
    `${TABLES_ENUM.USER_NOTIFICATIONS}.id`,
    `${TABLES_ENUM.USER_NOTIFICATIONS}.type`,
    `${TABLES_ENUM.USER_NOTIFICATIONS}.user_id`,
    `${TABLES_ENUM.USER_NOTIFICATIONS}.entity_id`,
    `${TABLES_ENUM.USER_NOTIFICATIONS}.read_at`,
  ] as const;

  constructor(
    private readonly requestService: RequestService,
    protected readonly logService: LogService,
  ) {
    super(TABLES_ENUM.USER_NOTIFICATIONS, logService);
  }

  async create(data: CreateUserNotificationInput): Promise<UserNotification> {
    const result = await super._create<UserNotificationSchemaWithoutTimestamps>(
      data,
      { select: this.COLUMNS },
    );
    if (!result) {
      throw new DbException('Could not create user notification');
    }
    return this.format(result);
  }

  async getAll(
    userId: number,
    filters: IndexUserNotificationRequest,
  ): Promise<UserNotification[]> {
    const query = this.query().select(this.COLUMNS).where('user_id', '=', userId);

    if (filters.type) {
      query.where('type', '=', filters.type);
    }

    if (filters.entity_id !== undefined) {
      query.where('entity_id', '=', filters.entity_id);
    }

    if (filters.unread === true) {
      query.where('read_at', 'IS', null);
    }

    query.orderBy('created_at', 'DESC');

    this.requestService.pagination = await this.handleOffsetPagination(
      query,
      filters,
    );

    const results = await query.get<UserNotificationSchemaWithoutTimestamps[]>();
    return (results ?? []).map((result) => this.format(result));
  }

  async getOne(id: number): Promise<UserNotification | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<UserNotificationSchemaWithoutTimestamps>();

    return result ? this.format(result) : null;
  }

  async findByTypeAndEntityId(
    type: EnumType<'NOTIFICATION_TYPE'>,
    entityId: number,
  ): Promise<UserNotification | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('type', '=', type)
      .where('entity_id', '=', entityId)
      .first<UserNotificationSchemaWithoutTimestamps>();

    return result ? this.format(result) : null;
  }

  async updateById(
    id: number,
    data: UpdateUserNotificationInput,
  ): Promise<UserNotification> {
    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length && values.length) {
      await this.query().where('id', '=', id).update(columns, values);
    }

    const result = await this.getOne(id);
    if (!result) {
      throw new DbException('Could not update user notification');
    }
    return result;
  }

  private format(
    result: UserNotificationSchemaWithoutTimestamps,
  ): UserNotification {
    return {
      id: result.id,
      type: result.type,
      user_id: result.user_id,
      entity_id: result.entity_id,
      read_at: result.read_at,
    };
  }
}
