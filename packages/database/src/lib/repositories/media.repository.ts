import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
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
} from '@repo/common-lib/types/media';
import { DbException } from '../exceptions';
import { Query } from '../facades';
import { BaseRepository } from './base.repository';

/**
 * Nest-free media repository for API subclasses and workers.
 * HTTP-only methods (getAll, SEO locale reads) live on the API subclass.
 */
export class MediaRepository extends BaseRepository {
  protected readonly COLUMNS: MediaSchemaColumns[] = [
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
    'media.media_type',
    'media.extension',
    'media.is_active',
    'media.status',
    'media.completed_at',
    'media.failed_reason',
    'media.seo_alt',
    'media.seo_title',
    'media.seo_description',
    'media.seo_filename',
    'media.seo_generated_at',
    'media.user_id',
    'media.created_at',
    'media.updated_at',
  ] as const;

  protected readonly COLUMNS_WITH_USER: MediaWithUserSchemaColumns[] = [
    ...this.COLUMNS,
    'users.id as u_id',
    'users.username',
    'users.name',
    'users.surname',
  ];

  constructor() {
    super('media');
  }

  static instance() {
    return new MediaRepository();
  }

  async findById(id: number): Promise<MediaWithUser> {
    const result = await this.query()
      .select(this.COLUMNS_WITH_USER)
      .where('media.id', '=', id)
      .join('user_id', 'users', 'id')
      .first<MediaWithUserSchema>();
    if (!result) {
      throw new DbException('Media not found with id ' + id, 404);
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

  async findManyByIds(ids: number[]): Promise<Media[]> {
    if (!ids.length) return [];
    const results = await this.query()
      .select(this.COLUMNS)
      .whereIn('media.id', ids)
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

  protected formatMediaWithUser(result: MediaWithUserSchema): MediaWithUser {
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

  protected formatMedia(result: MediaSchema): Media {
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
      media_type: result.media_type,
      extension: result.extension,
      is_active: result.is_active,
      status: result.status,
      completed_at: result.completed_at,
      failed_reason: result.failed_reason,
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
   * Rows for `getSitemapMedia` / `countSitemapMedia`. One predicate, used by both, so the count
   * that decides how many shards exist can never disagree with the rows the shards contain.
   *
   * A media item is only public if it is itself visible AND it is published inside at least one
   * public portfolio or collection — the media table also holds atelier drafts, which are
   * reachable by URL but must never be advertised.
   */
  private static readonly SITEMAP_MEDIA_FROM = `
    FROM ${TABLES_ENUM.MEDIA} m
    INNER JOIN ${TABLES_ENUM.USERS} u ON u.id = m.user_id
    WHERE m.blocked_at IS NULL
      AND m.is_active = true
      AND (
        EXISTS (
          SELECT 1 FROM ${TABLES_ENUM.PORTFOLIO_MEDIA} pm
          INNER JOIN ${TABLES_ENUM.PORTFOLIOS} p ON p.id = pm.portfolio_id
          WHERE pm.media_id = m.id
            AND p.blocked_at IS NULL AND p.is_active = true AND p.is_indexable = true
        )
        OR EXISTS (
          SELECT 1 FROM ${TABLES_ENUM.COLLECTION_MEDIA} cm
          INNER JOIN ${TABLES_ENUM.COLLECTIONS} c ON c.id = cm.collection_id
          WHERE cm.media_id = m.id
            AND c.blocked_at IS NULL AND c.is_active = true AND c.is_indexable = true
        )
      )`;

  /**
   * Public media for the sitemap, keyed by the PRIMARY media URL
   * (`/artists/{username}/media/{public_id}`) — the URL the nested portfolio/collection views
   * canonicalize to, so only the canonical form is ever submitted.
   */
  async getSitemapMedia(
    limit: number,
    offset: number,
  ): Promise<
    { username: string; public_id: string; updated_at: string; thumbnail: string | null }[]
  > {
    const result = await Query.raw(
      `SELECT m.public_id, m.updated_at, m.thumbnail, u.username
       ${MediaRepository.SITEMAP_MEDIA_FROM}
       ORDER BY m.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : []).map(
      (row: {
        username: string;
        public_id: string;
        updated_at: string;
        thumbnail: string | null;
      }) => ({
        username: row.username,
        public_id: row.public_id,
        updated_at: row.updated_at,
        thumbnail: row.thumbnail ?? null,
      }),
    );
  }

  /** Count for `getSitemapMedia` (same predicate). */
  async countSitemapMedia(): Promise<number> {
    const result = await Query.raw(
      `SELECT COUNT(*)::int AS count ${MediaRepository.SITEMAP_MEDIA_FROM}`,
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return Number((Array.isArray(rows) ? rows : [])[0]?.count ?? 0);
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
