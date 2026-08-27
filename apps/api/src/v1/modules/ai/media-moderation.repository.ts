import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import {
  MediaModerationSchema,
  MediaModerationSchemaColumns,
} from '@repo/common-lib/schemas/media-moderation';
import {
  CreateMediaModerationInput,
  UpdateMediaModerationInput,
  MediaModeration,
  MediaModerationIndexRequest,
} from '@repo/common-lib/types/media-moderation';

@Injectable()
export class MediaModerationRepository extends BaseRepository {
  private readonly COLUMNS: MediaModerationSchemaColumns[] = [
    'media_moderations.id',
    'media_moderations.is_allowed',
    'media_moderations.severity',
    'media_moderations.content_type',
    'media_moderations.reason',
    'media_moderations.user_id',
    'media_moderations.created_at',
    'media_moderations.updated_at',
  ] as const;

  constructor() {
    super('media_moderations');
  }

  async findById(id: number): Promise<MediaModeration> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<MediaModerationSchema>();
    if (!result) {
      throw new HttpException(
        'MediaModeration not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatMediaModeration(result);
  }

  async findByUserId(userId: number): Promise<MediaModeration[]> {
    const results = await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .get<MediaModerationSchema[]>();
    return results.map((result) => this.formatMediaModeration(result));
  }

  async findOneByColumn(
    column: keyof MediaModerationSchema,
    value: any,
  ): Promise<MediaModeration | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where(column, '=', value)
      .first<MediaModerationSchema>();
    if (!result) return null;
    return this.formatMediaModeration(result);
  }

  async create(data: CreateMediaModerationInput): Promise<MediaModeration> {
    const result = await super._create<MediaModerationSchema>(data, {
      select: this.COLUMNS,
    });
    return this.formatMediaModeration(result);
  }

  async updateById(
    id: number,
    data: UpdateMediaModerationInput,
  ): Promise<MediaModeration> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    await this.query().where('id', '=', id).update(columns, values);
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<MediaModerationSchema>();
    return this.formatMediaModeration(result);
  }

  async deleteById(id: number): Promise<void> {
    await this.query().where('id', '=', id).delete();
  }

  async findAll(filters: MediaModerationIndexRequest): Promise<MediaModeration[]> {
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<MediaModerationSchema[]>();
    return results.map((result) => this.formatMediaModeration(result));
  }

  async applyFilters(
    filters: MediaModerationIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.select(this.COLUMNS);

    if (filters.user_id) {
      query.where('user_id', '=', filters.user_id);
    }

    if (filters.is_allowed !== undefined) {
      query.where('is_allowed', '=', filters.is_allowed);
    }

    if (filters.created_at_from) {
      query.where('created_at', '>=', filters.created_at_from);
    }

    if (filters.created_at_to) {
      query.where('created_at', '<=', filters.created_at_to);
    }

    query.orderBy('created_at', 'DESC');
    return query;
  }

  private formatMediaModeration(
    result: MediaModerationSchema,
  ): MediaModeration {
    return {
      id: result.id,
      is_allowed: result.is_allowed,
      severity: result.severity,
      content_type: result.content_type,
      reason: result.reason,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }
}
