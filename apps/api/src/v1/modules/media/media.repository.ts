import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import {
  MediaSchema,
  MediaSchemaColumns,
  MediaSchemaWithoutTimestamps,
  MediaWithTranslationsSchema,
} from '@repo/common-lib/schemas/media';
import {
  CreateMediaInput,
  UpdateMediaInput,
  Media,
  MediaIndexRequest,
  FullMedia,
} from '@repo/common-lib/types/media';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class MediaRepository extends BaseRepository {
  private readonly COLUMNS: MediaSchemaColumns[] = [
    'media.id',
    'media.title',
    'media.description',
    'media.bytes',
    'media.url',
    'media.thumbnail',
    'media.blocked',
    'media.shape',
    'media.extension',
    'media.is_active',
    'media.tags',
    'media.user_id',
  ] as const;

  private readonly FULL_COLUMNS: string[] = [
    // Media columns
    ...this.COLUMNS,
    'media.created_at',
    'media.updated_at',
    // Translation columns (aliased to avoid conflicts)
    'media_translations.id as tr_id',
    'media_translations.name as tr_name',
    'media_translations.description as tr_description',
    'media_translations.language_code',
  ];

  constructor(private readonly requestService: RequestService) {
    super('media');
  }

  async findAll(filters: MediaIndexRequest): Promise<Media[] | FullMedia[]> {
    const query = await this.applyFilters(filters, this.newQuery());
    const results = await query.get<
      MediaSchemaWithoutTimestamps[] | MediaWithTranslationsSchema[]
    >();
    return filters.list_type === 'FULL'
      ? this.formatFullMedia(results as MediaWithTranslationsSchema[])
      : results.map((result: MediaSchemaWithoutTimestamps) =>
          this.formatMedia(result),
        );
  }

  async findById(id: number): Promise<Media> {
    const result = await this.queryBuilder
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<MediaSchemaWithoutTimestamps>();
    if (!result) {
      throw new HttpException(
        'Media not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatMedia(result);
  }

  async findByUserId(userId: number): Promise<Media[]> {
    const results = await this.queryBuilder
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .get<MediaSchemaWithoutTimestamps[]>();
    return results.map((result) => this.formatMedia(result));
  }

  async findOneByColumn(
    column: keyof MediaSchema,
    value: any,
  ): Promise<Media | null> {
    const result = await this.queryBuilder
      .select(this.COLUMNS)
      .where(column, '=', value)
      .first<MediaSchemaWithoutTimestamps>();
    if (!result) return null;
    return this.formatMedia(result);
  }

  async create(data: CreateMediaInput): Promise<Media> {
    const result = await super._create<MediaSchemaWithoutTimestamps>(data, {
      select: this.COLUMNS,
    });
    return this.formatMedia(result);
  }

  async updateById(id: number, data: UpdateMediaInput): Promise<Media> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    await this.queryBuilder.where('id', '=', id).update(columns, values);
    const result = await this.queryBuilder
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<MediaSchemaWithoutTimestamps>();
    return this.formatMedia(result);
  }

  async deleteById(id: number): Promise<void> {
    await this.queryBuilder.where('id', '=', id).delete();
  }

  async applyFilters(
    filters: MediaIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    if (filters.user_id) {
      query.where('user_id', '=', filters.user_id);
    }
    if (filters.list_type === 'FULL') {
      query.select(this.FULL_COLUMNS);
      query.join('id', 'media_translations', 'media_id', 'LEFT');
    } else {
      query.select(this.COLUMNS);
    }

    if (filters.shape) {
      query.where('shape', '=', filters.shape);
    }

    if (filters.type) {
      query.where('type', '=', filters.type);
    }

    if (typeof filters.is_active === 'boolean') {
      query.where('is_active', '=', filters.is_active);
    }

    if (typeof filters.blocked === 'boolean') {
      query.where('blocked', '=', filters.blocked);
    }
    this.requestService.pagination =
      await BaseRepository.handleOffsetPagination(query, filters);

    return query;
  }

  private formatMedia(result: MediaSchemaWithoutTimestamps): Media {
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      bytes: result.bytes,
      url: result.url,
      thumbnail: result.thumbnail,
      blocked: result.blocked,
      shape: result.shape,
      extension: result.extension,
      is_active: result.is_active,
      tags: result.tags,
      user_id: result.user_id,
    };
  }

  private formatFullMedia(results: MediaWithTranslationsSchema[]): FullMedia[] {
    const mediaMap: { [id: number]: FullMedia } = {};
    for (const row of results) {
      if (!mediaMap[row.id]) {
        // First time seeing this media, initialize it
        mediaMap[row.id] = {
          ...this.formatMedia(row),
          translations: [],
        };
      }
      if (row.tr_id) {
        mediaMap[row.id].translations.push({
          id: row.tr_id,
          name: row.tr_name,
          description: row.tr_description,
          language_code: row.language_code,
          media_id: row.id,
        });
      }
    }

    return Object.values(mediaMap);
  }
}
