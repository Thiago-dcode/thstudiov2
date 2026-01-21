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
    'user_extra_data.media_size',
    'user_extra_data.media_count',
    'user_extra_data.projects_count',
    'user_extra_data.clients_count',
    'user_extra_data.services_count',
    'user_extra_data.portfolios_count',
    'user_extra_data.user_id',
  ] as const;

  constructor() {
    super('user_extra_data');
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
    return result;
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
    return result;
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
    return result;
  }


  async create(extraData: UpdateOrCreateUserExtraDataInput): Promise<UserExtraData> {
    const result = await super._create<UserExtraDataSchemaWithoutTimestamps>(
      extraData,
      { select: this.COLUMNS },
    );
    return result;
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
    return result;
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
    return result;
  }


}
