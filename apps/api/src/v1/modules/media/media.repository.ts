import { Injectable } from '@nestjs/common';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
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

/**
 * HTTP-facing media repository: pagination + locale-aware SEO/tag reads.
 * Core CRUD/sitemap live on the database base class.
 */
@Injectable()
export class MediaRepository extends BaseMediaRepository {
  constructor(private readonly requestService: RequestService) {
    super();
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

    // `completed` maps to `status`: only COMPLETED rows when true, anything else when false.
    if (typeof filters.completed === 'boolean') {
      if (filters.completed) {
        query.where('completed_at', '!=', null);
      } else {
        query.where('completed_at', '=', null);
      }
    }
    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);
    query.orderBy('created_at', 'DESC');
    return query;
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

  /**
   * The media's LLM-assigned content TAGS, localized to the request language
   * (COALESCE translation → main-row English name). Used for JSON-LD keywords + on-page chips.
   */
  async getTagsByMediaId(mediaId: number): Promise<string[]> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const result = await Query.raw(
      `SELECT COALESCE(ct.name, c.name) AS name
       FROM ${TABLES_ENUM.MEDIA_CATEGORIES} mc
       INNER JOIN ${TABLES_ENUM.CATEGORIES} c
         ON c.id = mc.category_id AND c.type = 'TAGS' AND c.is_active = true
       LEFT JOIN ${TABLES_ENUM.CATEGORY_TRANSLATIONS} ct
         ON ct.category_id = c.id AND ct.language_code = $1
       WHERE mc.media_id = $2
       ORDER BY c.id`,
      [lang, mediaId],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : [])
      .map((r) => (r as { name?: string | null }).name)
      .filter((n): n is string => !!n);
  }
}
