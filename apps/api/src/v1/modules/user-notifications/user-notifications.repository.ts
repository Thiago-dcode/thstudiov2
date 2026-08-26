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
  UserNotificationRow,
} from '@repo/common-lib/types/user-notification';
import { DEFAULT_USER_NOTIFICATION_ORDER_BY } from '@repo/common-lib/constants/user-notification';
import { DbException } from '@repo/database/exceptions';
import { QueryBuilder } from '@repo/database/queryBuilder';
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
    `${TABLES_ENUM.USER_NOTIFICATIONS}.updated_at`,
  ] as const;

  constructor(
    private readonly requestService: RequestService,
    protected readonly logService: LogService,
  ) {
    super(TABLES_ENUM.USER_NOTIFICATIONS, logService);
  }

  async create(data: CreateUserNotificationInput): Promise<UserNotificationRow> {
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
  ): Promise<UserNotificationRow[]> {
    const query = this.query().select(this.COLUMNS).where('user_id', '=', userId);

    this.applyWhereFilters(query, filters);

    // Before `handleOffsetPagination`, which appends the primary key as a tiebreaker so rows with
    // an identical sort value keep a stable order across pages.
    query.orderBy(
      filters.order_by || DEFAULT_USER_NOTIFICATION_ORDER_BY,
      filters.order || 'DESC',
    );

    this.requestService.pagination = await this.handleOffsetPagination(
      query,
      filters,
    );

    const results = await query.get<UserNotificationSchemaWithoutTimestamps[]>();
    return (results ?? []).map((result) => this.format(result));
  }

  private applyWhereFilters(
    query: QueryBuilder,
    filters: IndexUserNotificationRequest,
  ): void {
    if (filters.type) {
      query.where('type', '=', filters.type);
    }

    if (filters.entity_id !== undefined) {
      query.where('entity_id', '=', filters.entity_id);
    }

    if (filters.unread === true) {
      query.where('read_at', 'IS', null);
    }

    if (filters.created_from) {
      query.where(
        `${TABLES_ENUM.USER_NOTIFICATIONS}.created_at`,
        '>=',
        filters.created_from,
      );
    }

    if (filters.created_to) {
      query.where(
        `${TABLES_ENUM.USER_NOTIFICATIONS}.created_at`,
        '<=',
        filters.created_to,
      );
    }
  }

  async getOne(id: number): Promise<UserNotificationRow | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<UserNotificationSchemaWithoutTimestamps>();

    return result ? this.format(result) : null;
  }

  async findByTypeAndEntityId(
    type: EnumType<'NOTIFICATION_TYPE'>,
    entityId: number,
  ): Promise<UserNotificationRow | null> {
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
  ): Promise<UserNotificationRow> {
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
  ): UserNotificationRow {
    return {
      id: result.id,
      type: result.type,
      user_id: result.user_id,
      entity_id: result.entity_id,
      read_at: result.read_at,
      updated_at: result.updated_at,
    };
  }
}
