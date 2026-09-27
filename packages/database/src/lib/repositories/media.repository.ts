import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { artistShareReadySql } from '@repo/common-lib/utils/artist-share-ready';
import { sitemapImagePathSql } from '@repo/common-lib/utils/sitemap-image-sql';
import { MediaSeoTranslation } from '@repo/common-lib/types/ai';
import {
  MediaLocationJoinColumns,
  MediaLocationJoinSchema,
  MediaSchema,
  MediaSchemaColumns,
  MediaWithUserSchema,
  MediaWithUserSchemaColumns,
} from '@repo/common-lib/schemas/media';
import {
  CreateMediaInput,
  UpdateMediaInternalInput,
  Media,
  MediaLocation,
  MediaWithUser,
} from '@repo/common-lib/types/media';
import { Join, SqlValue } from '@repo/common-lib/types/database';
import { MediaHelper } from '@repo/common-lib/utils/media';
import { DbException } from '../exceptions';
import { Query } from '../facades';
import { BaseRepository } from './base.repository';
import { QueryBuilder } from '../builder/queryBuilder';

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
    'media.previews',
    'media.previews_bytes',
    'media.video_preview',
    'media.video_preview_bytes',
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
    'media.location_id',
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

  /** Selected alongside {@link LOCATION_JOIN}; {@link formatMedia} folds them into `location`. */
  protected readonly LOCATION_COLUMNS: MediaLocationJoinColumns[] = [
    'locations.id as l_id',
    'locations.formatted as l_formatted',
    'locations.name as l_name',
  ];

  /** LEFT: most media have no location, and they must still come back. */
  protected static readonly LOCATION_JOIN: Join = {
    type: 'LEFT',
    localColumn: 'location_id',
    foreignTable: TABLES_ENUM.LOCATIONS,
    foreignColumn: 'id',
  };

  /** Adds the place to a media read. Pair with {@link LOCATION_COLUMNS} in the select. */
  protected withLocation(query: QueryBuilder): QueryBuilder {
    const { localColumn, foreignTable, foreignColumn, type } = MediaRepository.LOCATION_JOIN;
    query.join(localColumn, foreignTable, foreignColumn, type);
    return query;
  }

  constructor() {
    super('media');
  }

  static instance() {
    return new MediaRepository();
  }

  async findById(id: number): Promise<MediaWithUser> {
    const result = await this.withLocation(
      this.query()
        .select([...this.COLUMNS_WITH_USER, ...this.LOCATION_COLUMNS])
        .where('media.id', '=', id)
        .join('user_id', 'users', 'id'),
    ).first<MediaWithUserSchema & MediaLocationJoinSchema>();
    if (!result) {
      throw new DbException('Media not found with id ' + id, 404);
    }
    return this.formatMediaWithUser(result);
  }

  async findByUserId(userId: number): Promise<Media[]> {
    const results = await this.withLocation(
      this.query()
        .select([...this.COLUMNS, ...this.LOCATION_COLUMNS])
        .where('media.user_id', '=', userId),
    ).get<(MediaSchema & MediaLocationJoinSchema)[]>();
    return results.map((result) => this.formatMedia(result));
  }

  async findManyByIds(ids: number[]): Promise<Media[]> {
    if (!ids.length) return [];
    // With the place: update notifications carry these rows, and a payload without `location`
    // would leave the client showing the place from before the edit.
    const results = await this.withLocation(
      this.query()
        .select([...this.COLUMNS, ...this.LOCATION_COLUMNS])
        .whereIn('media.id', ids),
    ).get<(MediaSchema & MediaLocationJoinSchema)[]>();
    return results.map((result) => this.formatMedia(result));
  }

  async findOneByColumn(
    column: keyof MediaSchema,
    value: any,
  ): Promise<MediaWithUser | null> {
    const result = await this.withLocation(
      this.query()
        .select([...this.COLUMNS_WITH_USER, ...this.LOCATION_COLUMNS])
        .where(column, '=', value)
        .join('user_id', 'users', 'id'),
    ).first<MediaWithUserSchema & MediaLocationJoinSchema>();
    if (!result) return null;
    return this.formatMediaWithUser(result);
  }

  /**
   * Column values as the driver can bind them.
   *
   * `previews` is the one column that cannot go over the wire as-is: it is `jsonb`, and
   * node-postgres binds a JS array as a Postgres ARRAY literal (`{a,b}`), which jsonb rejects.
   * So it travels as JSON text, exactly as `layout_config.config` does. No `::jsonb` cast is
   * needed on an INSERT or UPDATE — Postgres infers the parameter's type from the target
   * column — which is why the cast only appears on that repository's `VALUES`/`EXCLUDED` write.
   *
   * Public so the seeds can write media rows through the same conversion.
   */
  static toRow(data: Partial<MediaSchema>): Record<string, SqlValue> {
    const row: Record<string, SqlValue> = {};
    for (const [column, value] of Object.entries(data)) {
      row[column] =
        column === 'previews' && Array.isArray(value)
          ? JSON.stringify(value)
          : (value as SqlValue);
    }
    return row;
  }

  async create(data: CreateMediaInput): Promise<Media> {
    const result = await super._create<MediaSchema & MediaLocationJoinSchema>(
      MediaRepository.toRow(data),
      {
        select: [...this.COLUMNS, ...this.LOCATION_COLUMNS],
        join: [MediaRepository.LOCATION_JOIN],
      },
    );
    return this.formatMedia(result);
  }

  async updateById(id: number, data: UpdateMediaInternalInput): Promise<Media> {
    const row = MediaRepository.toRow(data);
    const columns = Object.keys(row);
    const values = Object.values(row);
    await this.query().where('id', '=', id).update(columns, values);
    // Read back with the place joined: an edit that changed the location must return the new one.
    const result = await this.withLocation(
      this.query()
        .select([...this.COLUMNS, ...this.LOCATION_COLUMNS])
        .where('media.id', '=', id),
    ).first<MediaSchema & MediaLocationJoinSchema>();
    return this.formatMedia(result);
  }

  /**
   * Releases a row that an update or metadata job parked in UPDATING / GENERATING_METADATA,
   * handing it back to the status {@link MediaHelper.restingStatus} says it has earned.
   *
   * The row is read here rather than taken from the caller on purpose: those jobs run for
   * seconds to minutes, and the media processor may have committed (or failed) the upload in the
   * meantime. Restoring from the snapshot the job started with would overwrite that with stale
   * news. Returns null when the media was deleted while the job ran.
   */
  async restoreStatus(id: number): Promise<Media | null> {
    const current = await this.findOneByColumn('id', id);
    if (!current) return null;
    return this.updateById(id, { status: MediaHelper.restingStatus(current) });
  }

  async deleteById(id: number): Promise<void> {
    await this.query().where('id', '=', id).delete();
  }

  /**
   * `undefined` when the read did not join locations (the key is absent), `null` when it did
   * and the media has no place — so a compact read never claims "no location" it did not check.
   */
  protected static formatLocation(
    result: Partial<MediaLocationJoinSchema>,
  ): MediaLocation | null | undefined {
    if (!('l_id' in result)) return undefined;
    if (result.l_id == null) return null;
    return {
      id: result.l_id,
      formatted: result.l_formatted ?? '',
      name: result.l_name ?? '',
    };
  }

  protected formatMediaWithUser(
    result: MediaWithUserSchema & Partial<MediaLocationJoinSchema>,
  ): MediaWithUser {
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

  /**
   * The inverse of {@link MediaRepository.toRow}'s one special case.
   *
   * `pg`'s type parsers already hand back parsed jsonb, so this is normally the identity — but
   * a raw text read or an overridden parser yields the string instead, and `layout_config`
   * guards the same way. Anything that is not an array of keys reads as "no previews" rather
   * than propagating a shape no consumer can use.
   */
  protected static parsePreviews(value: MediaSchema['previews']): string[] | null {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    try {
      const parsed: unknown = JSON.parse(value as unknown as string);
      return Array.isArray(parsed) ? (parsed as string[]) : null;
    } catch {
      return null;
    }
  }

  protected formatMedia(result: MediaSchema & Partial<MediaLocationJoinSchema>): Media {
    return {
      id: result.id,
      public_id: result.public_id,
      title: result.title,
      description: result.description,
      bytes: result.bytes,
      thumbnail_bytes: result.thumbnail_bytes,
      url: result.url,
      thumbnail: result.thumbnail,
      previews: MediaRepository.parsePreviews(result.previews),
      previews_bytes: result.previews_bytes,
      video_preview: result.video_preview,
      video_preview_bytes: result.video_preview_bytes,
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
      location_id: result.location_id ?? null,
      location: MediaRepository.formatLocation(result),
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
   * reachable by URL but must never be advertised. It must also be fully processed and owned by a
   * share-ready artist. Public so the API's SEO metadata `noindex` applies the exact same rule.
   */
  static readonly PUBLIC_MEDIA_PREDICATE = `m.blocked_at IS NULL
      AND m.is_active = true
      AND m.completed_at IS NOT NULL
      AND m.url IS NOT NULL
      AND ${artistShareReadySql('m.user_id')}
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

  /** Rows for `getSitemapMedia` / `countSitemapMedia`. */
  private static readonly SITEMAP_MEDIA_FROM = `
    FROM ${TABLES_ENUM.MEDIA} m
    INNER JOIN ${TABLES_ENUM.USERS} u ON u.id = m.user_id
    WHERE ${MediaRepository.PUBLIC_MEDIA_PREDICATE}`;

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
      `SELECT m.public_id, m.updated_at, ${sitemapImagePathSql('m')} AS thumbnail, u.username
       ${MediaRepository.SITEMAP_MEDIA_FROM}
       ORDER BY m.id ASC
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
