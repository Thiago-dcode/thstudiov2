import { LogService } from '@repo/backend-lib/services/log-service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { Query } from '@repo/database/facades';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { MediaSeoTranslation } from '@repo/common-lib/types/ai';
import {
  MediaSchema,
  MediaSchemaColumns,
  MediaWithUserSchema,
  MediaWithUserSchemaColumns,
} from '@repo/common-lib/schemas/media';
import {
  CreateMediaInput,
  UpdateMediaInternalInput,
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
    'media.is_featured',
    'media.is_value_pillars',
    'media.is_highlight',
    'media.blocked_at',
    'media.shape',
    'media.aspect_ratio',
    'media.compression_level',
    'media.extension',
    'media.is_active',
    'media.seo_alt',
    'media.seo_title',
    'media.seo_description',
    'media.seo_filename',
    'media.seo_generated_at',
    'media.user_id',
    'media.created_at',
    'media.updated_at',
  ] as const;

  private readonly COLUMNS_WITH_USER: MediaWithUserSchemaColumns[] = [
    ...this.COLUMNS,
    'users.id as u_id',
    'users.username',
    'users.name',
    'users.surname',
  ];

  constructor(private readonly requestService: RequestService, protected readonly logService: LogService) {
    super('media', logService);
  }

  async getAll(filters: MediaIndexRequest = {}): Promise<Media[] | MediaWithUser[]> {
    const compact = filters.compact !== false;
    const baseQuery = compact
      ? this.query()
      : this.query().join('user_id', 'users', 'id');
    const query = await this.applyFilters(filters, baseQuery, compact);

    if (compact) {
      const results = await query.get<MediaSchema[]>();
      return results.map((result) => this.formatMedia(result));
    }

    const results = await query.get<MediaWithUserSchema[]>();
    return results.map((result) => this.formatMediaWithUser(result));
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

  async updateById(id: number, data: UpdateMediaInternalInput): Promise<Media> {
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
    compact = true,
  ): Promise<QueryBuilder> {

    if (filters.search) {
      const term = `%${filters.search}%`;
      query.whereGroup([
        ['title', 'ILIKE', term, 'where'],
        ['seo_alt', 'ILIKE', term, 'orWhere'],
        ['seo_title', 'ILIKE', term, 'orWhere'],
        ['seo_description', 'ILIKE', term, 'orWhere'],
        ['seo_filename', 'ILIKE', term, 'orWhere'],
      ]);
    }
    if (filters.user_id) {
      query.where('user_id', filters.user_id);
    }
    query.select(compact ? this.COLUMNS : this.COLUMNS_WITH_USER);

    if (filters.shape) {
      query.where('shape', filters.shape);
    }

    // if (filters.type) {
    //   query.where('type', filters.type);
    // }

    if (typeof filters.is_active === 'boolean') {
      query.where('is_active', filters.is_active);
    }

    if (typeof filters.is_featured === 'boolean') {
      query.where('is_featured', filters.is_featured);
    }

    if (typeof filters.is_value_pillars === 'boolean') {
      query.where('is_value_pillars', filters.is_value_pillars);
    }

    if (typeof filters.is_highlight === 'boolean') {
      query.where('is_highlight', filters.is_highlight);
    }

    // `blocked` is a boolean filter in DTOs, but the DB uses `blocked_at`.
    if (typeof filters.blocked === 'boolean') {
      if (filters.blocked) {
        query.where('blocked_at', 'IS NOT', null);
      } else {
        query.where('blocked_at', 'IS', null);
      }
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
        surname: result.surname,
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
      is_featured: result.is_featured,
      is_value_pillars: result.is_value_pillars,
      is_highlight: result.is_highlight,
      blocked_at: result.blocked_at,
      shape: result.shape,
      aspect_ratio: result.aspect_ratio,
      compression_level: result.compression_level,
      extension: result.extension,
      is_active: result.is_active,
      seo_alt: result.seo_alt,
      seo_title: result.seo_title,
      seo_description: result.seo_description,
      seo_filename: result.seo_filename,
      seo_generated_at: result.seo_generated_at,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  /**
   * Lean SEO-only read for `generateMetadata`: media SEO localized to the request language
   * (COALESCE translation → main-row EN fallback) + owner username + thumbnail + visibility flags.
   */
  async getSeoMetadataByPublicId(publicId: string): Promise<{
    seo_title: string | null;
    seo_description: string | null;
    thumbnail: string | null;
    username: string;
    is_active: boolean;
    blocked: boolean;
  } | null> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const result = await Query.raw(
      `SELECT m.thumbnail, m.is_active, (m.blocked_at IS NOT NULL) AS blocked, u.username,
              COALESCE(mt.seo_title, m.seo_title) AS seo_title,
              COALESCE(mt.seo_description, m.seo_description) AS seo_description
       FROM ${TABLES_ENUM.MEDIA} m
       INNER JOIN ${TABLES_ENUM.USERS} u ON u.id = m.user_id
       LEFT JOIN ${TABLES_ENUM.MEDIA_TRANSLATIONS} mt
         ON mt.media_id = m.id AND mt.language_code = $1
       WHERE m.public_id = $2
       LIMIT 1`,
      [lang, publicId],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    const row = (Array.isArray(rows) ? rows : [])[0] as
      | {
          seo_title: string | null;
          seo_description: string | null;
          thumbnail: string | null;
          username: string;
          is_active: boolean;
          blocked: boolean;
        }
      | undefined;
    if (!row) return null;
    return {
      seo_title: row.seo_title ?? null,
      seo_description: row.seo_description ?? null,
      thumbnail: row.thumbnail ?? null,
      username: row.username,
      is_active: row.is_active,
      blocked: row.blocked,
    };
  }

  /** Upsert per-locale SEO rows into media_translations (one row per app language). */
  async upsertSeoTranslations(mediaId: number, rows: MediaSeoTranslation[]): Promise<void> {
    for (const r of rows) {
      await Query.raw(
        `INSERT INTO ${TABLES_ENUM.MEDIA_TRANSLATIONS} (language_code, media_id, seo_title, seo_description, seo_alt)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (language_code, media_id)
         DO UPDATE SET seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description, seo_alt = EXCLUDED.seo_alt`,
        [r.language_code, mediaId, r.seo_title ?? null, r.seo_description ?? null, r.seo_alt ?? null],
      );
    }
  }
}
