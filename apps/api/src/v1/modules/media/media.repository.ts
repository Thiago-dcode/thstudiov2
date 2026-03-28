import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import {
  MediaSchema,
  MediaSchemaColumns,
  MediaWithUserSchema,
  MediaWithUserSchemaColumns,
} from '@repo/common-lib/schemas/media';
import {
  CreateMediaInput,
  UpdateMediaInput,
  Media,
  MediaWithUser,
  MediaIndexRequest,
} from '@repo/common-lib/types/media';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class MediaRepository extends BaseRepository {
  private readonly COLUMNS: MediaSchemaColumns[] = [
    'media.id',
    'media.public_id',
    'media.title',
    'media.description',
    'media.bytes',
    'media.thumbnail_bytes',
    'media.thumbnail',
    'media.url',
    'media.highlight',
    'media.blocked',
    'media.shape',
    'media.compression_level',
    'media.extension',
    'media.is_active',
    'media.seo_alt',
    'media.seo_title',
    'media.seo_description',
    'media.seo_filename',
    'media.user_id',
    'media.created_at',
    'media.updated_at',
  ] as const;

  private readonly COLUMNS_WITH_USER: MediaWithUserSchemaColumns[] = [
    ...this.COLUMNS,
    'users.id as u_id',
    'users.username',
    'users.name',
  ];

  constructor(private readonly requestService: RequestService) {
    super('media');
  }

  async getAll(filters: MediaIndexRequest): Promise<Media[]> {
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<MediaSchema[]>();
    return results.map((result) => this.formatMedia(result));
  }

  async findById(id: number): Promise<MediaWithUser> {
    const result = await this.query()
      .select(this.COLUMNS_WITH_USER)
      .where('media.id', '=', id)
      .join('user_id', 'users', 'id')
      .first<MediaWithUserSchema>();
    if (!result) {
      throw new HttpException(
        'Media not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatMediaWithUser(result);
  }

  async findByUserId(userId: number): Promise<Media[]> {
    const results = await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .get<MediaSchema[]>();
    return results.map((result) => this.formatMedia(result));
  }

  async findOneByColumn(
    column: keyof MediaSchema,
    value: any,
  ): Promise<MediaWithUser | null> {
    const result = await this.query()
      .select(this.COLUMNS_WITH_USER)
      .where(column, '=', value)
      .join('user_id', 'users', 'id')
      .first<MediaWithUserSchema>();
    if (!result) return null;
    return this.formatMediaWithUser(result);
  }

  async create(data: CreateMediaInput): Promise<Media> {
    const result = await super._create<MediaSchema>(data, {
      select: this.COLUMNS,
    });
    return this.formatMedia(result);
  }

  async updateById(id: number, data: UpdateMediaInput): Promise<Media> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    await this.query().where('id', '=', id).update(columns, values);
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<MediaSchema>();
    return this.formatMedia(result);
  }

  async deleteById(id: number): Promise<void> {
    await this.query().where('id', '=', id).delete();
  }

  async applyFilters(
    filters: MediaIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    if (filters.user_id) {
      query.where('user_id', '=', filters.user_id);
    }
    query.select(this.COLUMNS);

    if (filters.shape) {
      query.where('shape', '=', filters.shape);
    }

    // if (filters.type) {
    //   query.where('type', '=', filters.type);
    // }

    if (typeof filters.is_active === 'boolean') {
      query.where('is_active', '=', filters.is_active);
    }

    if (typeof filters.blocked === 'boolean') {
      query.where('blocked', '=', filters.blocked);
    }
    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);
    query.orderBy('created_at', 'DESC')
    return query;
  }

  private formatMediaWithUser(result: MediaWithUserSchema): MediaWithUser {
    return {
      ...this.formatMedia(result),
      user: {
        id: result.u_id,
        username: result.username,
        name: result.name,
      },
    };
  }

  private formatMedia(result: MediaSchema): Media {
    return {
      id: result.id,
      public_id: result.public_id,
      title: result.title,
      description: result.description,
      bytes: result.bytes,
      thumbnail_bytes: result.thumbnail_bytes,
      url: result.url,
      thumbnail: result.thumbnail,
      highlight: result.highlight,
      blocked: result.blocked,
      shape: result.shape,
      compression_level: result.compression_level,
      extension: result.extension,
      is_active: result.is_active,
      seo_alt: result.seo_alt,
      seo_title: result.seo_title,
      seo_description: result.seo_description,
      seo_filename: result.seo_filename,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }
}
