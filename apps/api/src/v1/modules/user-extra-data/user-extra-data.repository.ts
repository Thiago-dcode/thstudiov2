import { LogService } from '@repo/backend-lib/services/log-service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  UserExtraDataSchema,
  UserExtraDataSchemaColumns,
  UserExtraDataSchemaWithoutTimestamps,
} from '@repo/common-lib/schemas/user-extra-data';
import {
  UpdateOrCreateUserExtraDataInput,
  UserExtraData,
} from '@repo/common-lib/types/user-extra-data';

@Injectable()
export class UserExtraDataRepository extends BaseRepository {
  private readonly COLUMNS: UserExtraDataSchemaColumns[] = [
    'user_extra_data.id',
    'user_extra_data.storage_used_mb',
    'user_extra_data.media_count',
    'user_extra_data.projects_count',
    'user_extra_data.clients_count',
    'user_extra_data.services_count',
    'user_extra_data.portfolios_count',
    'user_extra_data.collections_count',
    'user_extra_data.ai_credits',
    'user_extra_data.ai_credits_consumed',
    'user_extra_data.next_ai_credits_reset',
    'user_extra_data.last_ai_credits_reset',
    'user_extra_data.account_strikes',
    'user_extra_data.ban_count',
    'user_extra_data.ban_lift',
    'user_extra_data.ban_start',
    'user_extra_data.user_id',
  ] as const;

  constructor(protected readonly logService: LogService) {
    super('user_extra_data', logService);
  }

  async findByUserId(userId: number): Promise<UserExtraData> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .first<UserExtraDataSchemaWithoutTimestamps>();
    if (!result) {
      throw new HttpException(
        'User extra data not found for user id ' + userId,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatUserExtraData(result);
  }

  async findById(id: number): Promise<UserExtraData> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<UserExtraDataSchemaWithoutTimestamps>();
    if (!result) {
      throw new HttpException(
        'User extra data not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatUserExtraData(result);
  }

  async findOneByColumn(
    column: keyof UserExtraDataSchema,
    value: any,
  ): Promise<UserExtraData | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where(column, '=', value)
      .first<UserExtraDataSchemaWithoutTimestamps>();
    if (!result) return null;
    return this.formatUserExtraData(result);
  }

  async create(extraData: UpdateOrCreateUserExtraDataInput): Promise<UserExtraData> {
    const result = await super._create<UserExtraDataSchemaWithoutTimestamps>(
      extraData,
      { select: this.COLUMNS },
    );
    return this.formatUserExtraData(result);
  }

  async updateById(
    id: number,
    data: UpdateOrCreateUserExtraDataInput,
  ): Promise<UserExtraData> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    await this.query().where('id', '=', id).update(columns, values);
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<UserExtraDataSchemaWithoutTimestamps>();
    return this.formatUserExtraData(result);
  }

  async updateByUserId(
    userId: number,
    data: UpdateOrCreateUserExtraDataInput,
  ): Promise<UserExtraData> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    await this.query().where('user_id', '=', userId).update(columns, values);
    const result = await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .first<UserExtraDataSchemaWithoutTimestamps>();
    return this.formatUserExtraData(result);
  }

  async findDueForAiCreditsReset(today: Date): Promise<UserExtraData[]> {
    const results = await this.query()
      .select(this.COLUMNS)
      .where('next_ai_credits_reset', '<=', today)
      .get<UserExtraDataSchemaWithoutTimestamps[]>();

    return results.map((r) => this.formatUserExtraData(r));
  }

  private formatUserExtraData(
    result: UserExtraDataSchemaWithoutTimestamps,
  ): UserExtraData {
    return {
      id: result.id,
      storage_used_mb: result.storage_used_mb,
      media_count: result.media_count,
      projects_count: result.projects_count,
      clients_count: result.clients_count,
      services_count: result.services_count,
      portfolios_count: result.portfolios_count,
      collections_count: result.collections_count,
      ai_credits: result.ai_credits,
      ai_credits_consumed: result.ai_credits_consumed,
      next_ai_credits_reset: result.next_ai_credits_reset,
      last_ai_credits_reset: result.last_ai_credits_reset,
      account_strikes: result.account_strikes,
      ban_count: result.ban_count,
      ban_lift: result.ban_lift,
      ban_start: result.ban_start,
      user_id: result.user_id,
    };
  }
}
