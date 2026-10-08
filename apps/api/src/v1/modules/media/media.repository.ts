import { Injectable } from '@nestjs/common';
import { ENUMS, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import type { CategoryBase } from '@repo/common-lib/types/category';
import { DEFAULT_MEDIA_ORDER_BY } from '@repo/common-lib/constants/media';
import {
  MediaSchema,
  MediaWithUserSchema,
} from '@repo/common-lib/schemas/media';
import {
  Media,
  MediaWithUser,
  MediaIndexRequest,
} from '@repo/common-lib/types/media';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { Query } from '@repo/database/facades';
import { MediaRepository as BaseMediaRepository } from '@repo/database/repositories/media';
import { RequestService } from 'src/common/services/request.service';

type MediaUsageCountRow = {
  collections_count?: string | number | null;
  portfolios_count?: string | number | null;
  categories?: CategoryBase[] | null;
};

/**
 * HTTP-facing media repository: pagination + locale-aware SEO/tag reads.
 * Core CRUD/sitemap live on the database base class.
 */
@Injectable()
export class MediaRepository extends BaseMediaRepository {
  constructor(private readonly requestService: RequestService) {
    super();
  }

  /**
   * Where each media is used, as correlated subqueries (the pivots are indexed on the media side
   * for this). A portfolio counts once whether it shows the media directly or through one of its
   * collections — `UNION` dedupes the two paths — because both render it on the portfolio page.
   */
  private static readonly USAGE_COUNT_COLUMNS = [
    `(SELECT COUNT(*) FROM ${TABLES_ENUM.COLLECTION_MEDIA} ucm
      WHERE ucm.media_id = ${TABLES_ENUM.MEDIA}.id) AS collections_count`,
    `(SELECT COUNT(*) FROM (
        SELECT upm.portfolio_id FROM ${TABLES_ENUM.PORTFOLIO_MEDIA} upm
        WHERE upm.media_id = ${TABLES_ENUM.MEDIA}.id
        UNION
        SELECT upc.portfolio_id FROM ${TABLES_ENUM.PORTFOLIO_COLLECTION} upc
        INNER JOIN ${TABLES_ENUM.COLLECTION_MEDIA} upcm ON upcm.collection_id = upc.collection_id
        WHERE upcm.media_id = ${TABLES_ENUM.MEDIA}.id
      ) used_in_portfolios) AS portfolios_count`,
  ];

  /**
   * The media's disciplines / art styles as a JSON array, named for the request language (the same
   * COALESCE translation → main-row name the picker lists them with). TAGS are left out: they are
   * the AI's, and the artist cannot pick or remove them.
   *
   * The language is whitelisted against the enum because it is inlined into the SQL text; a value
   * outside it falls back to the default instead of reaching the query.
   */
  private categoriesColumn(): string {
    const requested = this.requestService.language;
    const lang = ENUMS.LANGUAGE_CODE.find((code) => code === requested) ?? DEFAULT_LANGUAGE;
    return `(SELECT COALESCE(json_agg(json_build_object(
        'id', c.id,
        'name', COALESCE(ct.name, c.name),
        'slug', c.slug,
        'type', c.type,
        'tags', '[]'::json,
        'thumbnail', c.thumbnail,
        'is_featured', c.is_featured,
        'is_active', c.is_active,
        'parent_id', c.parent_id
      ) ORDER BY c.id), '[]'::json)
      FROM ${TABLES_ENUM.MEDIA_CATEGORIES} mcat
      INNER JOIN ${TABLES_ENUM.CATEGORIES} c
        ON c.id = mcat.category_id AND c.is_active = true AND c.type <> 'TAGS'
      LEFT JOIN ${TABLES_ENUM.CATEGORY_TRANSLATIONS} ct
        ON ct.category_id = c.id AND ct.language_code = '${lang}'
      WHERE mcat.media_id = ${TABLES_ENUM.MEDIA}.id) AS categories`;
  }

  async getAll(filters: MediaIndexRequest = {}): Promise<Media[] | MediaWithUser[]> {
    const compact = filters.compact !== false;
    const baseQuery = this.withLocation(
      compact ? this.query() : this.query().join('user_id', 'users', 'id'),
    );
    const query = await this.applyFilters(filters, baseQuery, compact);

    if (compact) {
      const results = await query.get<(MediaSchema & MediaUsageCountRow)[]>();
      return results.map((result) => ({
        ...this.formatMedia(result),
        // COUNT(*) is a bigint, which pg hands back as a string.
        ...(filters.with_usage_counts && {
          collections_count: Number(result.collections_count ?? 0),
          portfolios_count: Number(result.portfolios_count ?? 0),
        }),
        ...(filters.with_categories && { categories: result.categories ?? [] }),
      }));
    }

    const results = await query.get<MediaWithUserSchema[]>();
    return results.map((result) => this.formatMediaWithUser(result));
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
    query.select([
      ...(compact ? this.COLUMNS : this.COLUMNS_WITH_USER),
      ...this.LOCATION_COLUMNS,
      ...(filters.with_usage_counts ? MediaRepository.USAGE_COUNT_COLUMNS : []),
      ...(filters.with_categories && compact ? [this.categoriesColumn()] : []),
    ]);

    if (filters.shape) {
      query.where('shape', filters.shape);
    }

    if (filters.media_type) {
      query.where('media_type', filters.media_type);
    }

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

    // `completed` asks one question - "does this media have an asset it is safe to show?" - and
    // `completed_at` is the single column that answers it. Nothing else is consulted here on
    // purpose.
    //
    // What makes that column trustworthy is that exactly one writer sets it: the media
    // processor's success commit, in the same UPDATE as the compressed bytes. Every failure path
    // clears it, a job that will be retried leaves it alone, and the jobs that merely park a row
    // in UPDATING / GENERATING_METADATA never touch it - so an edit or a metadata run on a
    // finished media keeps its timestamp and keeps showing, mid-flight and all.
    //
    // `status` cannot answer it. It is a lifecycle position, not a verdict: it defaulted to
    // COMPLETED for every row predating the column, and a job unrelated to the upload could hand
    // a row back as COMPLETED without knowing whether an asset was ever produced. Both holes are
    // closed now (see `restoreStatus` and the `media_completed_has_completed_at` constraint),
    // which is what makes the timestamp safe to filter on directly.
    //
    // The trade is deliberate: a FIRST upload still in flight has no timestamp yet and does not
    // come back here. It has no asset to render either - the client shows those from its own
    // in-progress upload state, and the row appears the moment the processor commits.
    if (typeof filters.completed === 'boolean') {
      if (filters.completed) {
        query.where('completed_at', 'IS NOT', null);
      } else {
        query.where('completed_at', 'IS', null);
      }
    }
    // Before `handleOffsetPagination`, which appends the primary key as a tiebreaker: ordered
    // after it, the sort would only ever break ties between ids and never take effect.
    const orderBy = filters.order_by || DEFAULT_MEDIA_ORDER_BY;
    const order = filters.order || 'DESC';
    // Only `seo_generated_at` is nullable. Media that never had metadata generated counts as the
    // oldest: first when sorting oldest first (the ones most in need of it), last when sorting
    // newest first. Postgres defaults to the opposite on both, so it is spelled out.
    query.orderBy(
      orderBy,
      order,
      orderBy === 'seo_generated_at' ? { nulls: order === 'ASC' ? 'FIRST' : 'LAST' } : {},
    );
    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);
    return query;
  }

  /** Ids of every category on the media — disciplines, styles and tags. */
  async categoryIdsByMediaId(mediaId: number): Promise<number[]> {
    const rows = await Query.table(TABLES_ENUM.MEDIA_CATEGORIES)
      .select(['category_id'])
      .where('media_id', '=', mediaId)
      .get<{ category_id: number }[]>();
    return rows.map((row) => row.category_id);
  }

  /**
   * The subset of `ids` an artist may put on a media: active categories that are not TAGS. Anything
   * else — unknown ids, deactivated categories, tags (the AI's) — is dropped, so a hand-built
   * request cannot attach what the picker would never offer.
   */
  async selectableCategoryIds(ids: number[]): Promise<number[]> {
    if (!ids.length) return [];
    const rows = await Query.table(TABLES_ENUM.CATEGORIES)
      .select(['id', 'type'])
      .whereIn('id', ids)
      .where('is_active', '=', true)
      .get<{ id: number; type: string }[]>();
    const selectable = new Set(rows.filter((row) => row.type !== 'TAGS').map((row) => row.id));
    // Keeps the caller's order, which is the order they were picked in.
    return ids.filter((id) => selectable.has(id));
  }

  /**
   * Media types of the owner's rows waiting on a metadata job. Their credits are only counted as
   * consumed once the job has written its usage row, so until then they must be reserved.
   */
  async findGeneratingMetadataTypes(userId: number): Promise<Pick<MediaSchema, 'media_type'>[]> {
    return await this.query()
      .select(['media_type'])
      .where('user_id', '=', userId)
      .where('status', '=', 'GENERATING_METADATA')
      .get<Pick<MediaSchema, 'media_type'>[]>();
  }

  /**
   * Sets `location_id` on the owner's rows in one write. Ids that are not theirs match nothing,
   * so a caller that already checked ownership cannot spill the place onto someone else's media.
   */
  async updateLocationByIds(
    ids: number[],
    userId: number,
    locationId: number,
  ): Promise<void> {
    if (!ids.length) return;
    await this.query()
      .whereIn('id', ids)
      .where('user_id', '=', userId)
      .update(['location_id'], [locationId]);
  }

  /**
   * Lean SEO-only read for `generateMetadata`: media SEO localized to the request language
   * (COALESCE translation → main-row EN fallback) + owner username + thumbnail + visibility flags.
   */
  async getSeoMetadataByPublicId(publicId: string): Promise<MediaSeoRow | null> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const result = await Query.raw(
      `SELECT m.thumbnail, m.title, m.description, u.username,
              (${BaseMediaRepository.PUBLIC_MEDIA_PREDICATE}) AS is_public,
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
    const row = (Array.isArray(rows) ? rows : [])[0] as MediaSeoRow | undefined;
    if (!row) return null;
    return {
      title: row.title ?? null,
      description: row.description ?? null,
      seo_title: row.seo_title ?? null,
      seo_description: row.seo_description ?? null,
      thumbnail: row.thumbnail ?? null,
      username: row.username,
      is_public: Boolean(row.is_public),
    };
  }

  /**
   * The media's SEO fields in the request language (media_translations), or null when the request
   * is in the default language or that language has no row. The main row holds the English SEO,
   * so callers keep it as the fallback.
   */
  async getSeoTranslation(mediaId: number): Promise<MediaSeoTranslationRow | null> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    if (lang === DEFAULT_LANGUAGE) return null;
    const result = await Query.raw(
      `SELECT seo_title, seo_description, seo_alt
       FROM ${TABLES_ENUM.MEDIA_TRANSLATIONS}
       WHERE media_id = $1 AND language_code = $2
       LIMIT 1`,
      [mediaId, lang],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return ((Array.isArray(rows) ? rows : [])[0] as MediaSeoTranslationRow | undefined) ?? null;
  }

  /**
   * The media's keywords: its disciplines / art styles (picked by the artist, or by the AI when they
   * picked none) followed by its content TAGS, localized to the request language (COALESCE
   * translation → main-row English name). Used for JSON-LD keywords.
   *
   * The classification leads because it is the strongest signal of what the work is ("Analog
   * Photography"), and it used to be left out — only the tags ever reached the page.
   */
  async getTagsByMediaId(mediaId: number): Promise<string[]> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const result = await Query.raw(
      `SELECT COALESCE(ct.name, c.name) AS name
       FROM ${TABLES_ENUM.MEDIA_CATEGORIES} mc
       INNER JOIN ${TABLES_ENUM.CATEGORIES} c
         ON c.id = mc.category_id AND c.is_active = true
       LEFT JOIN ${TABLES_ENUM.CATEGORY_TRANSLATIONS} ct
         ON ct.category_id = c.id AND ct.language_code = $1
       WHERE mc.media_id = $2
       ORDER BY (c.type = 'TAGS'), c.id`,
      [lang, mediaId],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : [])
      .map((r) => (r as { name?: string | null }).name)
      .filter((n): n is string => !!n);
  }
}

type MediaSeoTranslationRow = {
  seo_title: string | null;
  seo_description: string | null;
  seo_alt: string | null;
};

type MediaSeoRow = {
  title: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  thumbnail: string | null;
  username: string;
  /** Same rule as the sitemap (`PUBLIC_MEDIA_PREDICATE`). */
  is_public: boolean;
};
