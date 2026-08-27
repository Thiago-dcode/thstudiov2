import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { Query } from '@repo/database/facades';
import { foldLatinDiacriticsForMatch } from '@repo/common-lib/utils/fold-latin-diacritics';
import {
  PortfolioFullSchema,
  PortfolioFullSchemaColumns,
  PortfolioWithArtistSchema,
  PortfolioWithArtistSchemaColumns,
  PortfolioSchema,
} from '@repo/common-lib/schemas/portfolio';
import {
  CreatePortfolioInput,
  UpdatePortfolioInput,
  FullPortfolio,
  Portfolio,
  PortfolioIndexRequest,
} from '@repo/common-lib/types/portfolio';
import { EntitySeoFields, SeoTranslation } from '@repo/common-lib/types/ai';
import { CompactUser } from '@repo/common-lib/types/user';
import { DbException } from '@repo/database/exceptions';
import { RequestService } from 'src/common/services/request.service';
import { MediaPortfolio } from '@repo/common-lib/types/media';
import { CategoryBase } from '@repo/common-lib/types/category';
import {
  ColumBaseLayoutConfig,
  PortfolioLayout,
} from '@repo/common-lib/types/layout';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import { MIN_COLUMN_BASE_COLUMNS } from '@repo/common-lib/constants/limits';
import { SEO_REGENERATION_MIN_INTERVAL_DAYS } from '@repo/common-lib/constants/cache';

export function formatPortfolioLayout(
  row: Pick<PortfolioFullSchema, 'layout_id' | 'layout_name' | 'config'>,
): PortfolioLayout | undefined {
  if (!row.layout_id || !row.layout_name) {
    return undefined;
  }

  const parsedConfig =
    typeof row.config === 'string'
      ? (JSON.parse(row.config) as Record<string, unknown> | null)
      : row.config;

  switch (row.layout_name as EnumType<'LAYOUT_TYPE'>) {
    case 'MASONRY':
      return { name: 'MASONRY', config: null, layout_id: row.layout_id };
    case 'UNIFORM':
      return { name: 'UNIFORM', config: null, layout_id: row.layout_id };
    case 'COLUMN_BASE': {
      const columns =
        parsedConfig &&
          typeof parsedConfig === 'object' &&
          typeof (parsedConfig as { columns?: unknown }).columns === 'number'
          ? (parsedConfig as { columns: number }).columns
          : MIN_COLUMN_BASE_COLUMNS;

      return {
        name: 'COLUMN_BASE',
        config: { columns } satisfies ColumBaseLayoutConfig,
        layout_id: row.layout_id,
      };
    }
    default:
      return undefined;
  }
}

@Injectable()
export class PortfolioRepository extends BaseRepository {
  private readonly COLUMNS: PortfolioWithArtistSchemaColumns[] = [
    'portfolios.id',
    'portfolios.slug',
    'portfolios.title',
    'portfolios.thumbnail',
    'portfolios.description',
    'portfolios.is_featured',
    'portfolios.is_highlight',
    'portfolios.is_active',
    'portfolios.is_indexable',
    'portfolios.seo_title',
    'portfolios.seo_description',
    'portfolios.seo_generated_at',
    'portfolios.blocked_at',
    'portfolios.user_id',
    'portfolios.created_at',
    'portfolios.updated_at',
    // user (artist) — only id collides
    'users.id as u_id',
    'users.email',
    'users.username',
    'users.name',
    'users.surname',
    'users.benefit_id',
    'users.language',
  ] as const;

  private readonly FULL_COLUMNS: PortfolioFullSchemaColumns[] = [
    ...this.COLUMNS as unknown as PortfolioFullSchemaColumns[],
    'portfolio_media.media_id',
    'portfolio_media.position',
    'media.id as m_id',
    'media.public_id',
    'media.thumbnail as m_thumbnail',
    'media.url',
    'media.shape',
    'media.aspect_ratio',
    'media.title as m_title',
    'media.seo_alt',
    'media.seo_filename',
    'media.seo_description as m_seo_description',
    'media.seo_title as m_seo_title',
    'media.is_featured as m_is_featured',
    'media.is_highlight as m_is_highlight',
    'media.is_active as m_is_active',
    'categories.id as c_id',
    'categories.slug as c_slug',
    'categories.is_featured as c_is_featured',
    'categories.is_active as c_is_active',
    'layout_config.layout_id',
    'layout_config.config',
    'layouts.name as layout_name',
  ];

  constructor(private readonly requestService: RequestService) {
    super('portfolios');
  }

  async getAll(filters: PortfolioIndexRequest): Promise<Portfolio[]> {
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<PortfolioWithArtistSchema[]>();
    return results.map((result) => this.formatPortfolio(result));
  }

  async getBySlug(slug: string, userId: number): Promise<FullPortfolio | null> {
    const result = await this.applyFullPortfolioQuery(this.query())
      .where('portfolios.slug', '=', slug)
      .where('portfolios.user_id', '=', userId)
      .orderBy('portfolio_media.position', 'ASC')
      .get<PortfolioFullSchema[]>();

    if (!result || (Array.isArray(result) && result.length === 0)) return null;
    return this.formatFullPortfolio(Array.isArray(result) ? result : [result]);
  }

  async getFullById(id: number): Promise<FullPortfolio | null> {
    const result = await this.applyFullPortfolioQuery(this.query())
      .where('portfolios.id', '=', id)
      .orderBy('portfolio_media.position', 'ASC')
      .get<PortfolioFullSchema[]>();

    if (!result || (Array.isArray(result) && result.length === 0)) return null;
    return this.formatFullPortfolio(Array.isArray(result) ? result : [result]);
  }

  /**
   * Mark every portfolio displaying this media as needing fresh SEO. Its copy is written from the
   * media's titles/descriptions/alt, and nothing else marks it stale — the pivot changes, not
   * `portfolios.updated_at`.
   *
   * Marking it hands the work to the nightly `findDueForSeoGeneration` sweep rather than generating
   * on the spot: an artist running AI over a whole gallery touches the same portfolio once per image,
   * and one LLM call each would drain their tokens for a single final result.
   *
   * The stamp is nudged BACKWARDS rather than cleared. Both make the row stale, but backdating keeps
   * the real generation time, so `SEO_REGENERATION_MIN_INTERVAL_DAYS` still applies — clearing it to
   * NULL would take the never-generated branch and bypass the throttle entirely. A row that has never
   * been generated stays NULL (NULL minus an interval is NULL) and is still written immediately.
   */
  async markSeoStaleByMediaId(mediaId: number): Promise<void> {
    await Query.raw(
      `UPDATE ${TABLES_ENUM.PORTFOLIOS}
       SET seo_generated_at = seo_generated_at - INTERVAL '1 second'
       WHERE id IN (
         SELECT portfolio_id FROM ${TABLES_ENUM.PORTFOLIO_MEDIA} WHERE media_id = $1
       )`,
      [mediaId],
    );
  }

  /**
   * Portfolios with no SEO yet, or content newer than last SEO generation. A rewrite additionally
   * waits out `SEO_REGENERATION_MIN_INTERVAL_DAYS`, so editing a portfolio five times in a day costs
   * one regeneration, not five. Never-generated rows skip the wait and are written immediately.
   */
  async findDueForSeoGeneration(): Promise<{ id: number; user_id: number }[]> {
    const result = await Query.raw(
      `SELECT id, user_id
       FROM ${TABLES_ENUM.PORTFOLIOS}
       WHERE blocked_at IS NULL
         AND is_active = true
         AND is_indexable = true
         AND (
           seo_generated_at IS NULL
           OR (
             seo_generated_at < updated_at
             AND seo_generated_at < NOW() - (INTERVAL '1 day' * ${SEO_REGENERATION_MIN_INTERVAL_DAYS})
           )
         )
       ORDER BY updated_at ASC`,
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : []).map((row: { id: number; user_id: number }) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
    }));
  }

  /**
   * Sitemap enumeration: publicly indexable portfolios + owner username + up to `imageCap` gallery
   * thumbnail PATHS (ordered by pivot position) for the image-sitemap extension. Paths are signed
   * into URLs by the sitemap service. Same visibility predicate as `findDueForSeoGeneration`.
   */
  async getSitemapPortfolios(
    limit: number,
    offset: number,
    imageCap: number,
  ): Promise<{ username: string; slug: string; updated_at: string; image_paths: string[] }[]> {
    const result = await Query.raw(
      `SELECT p.slug, p.updated_at, u.username,
         COALESCE((
           SELECT array_agg(x.thumbnail)
           FROM (
             SELECT m.thumbnail
             FROM ${TABLES_ENUM.PORTFOLIO_MEDIA} pm
             JOIN ${TABLES_ENUM.MEDIA} m ON m.id = pm.media_id
             WHERE pm.portfolio_id = p.id
               AND m.thumbnail IS NOT NULL AND m.blocked_at IS NULL AND m.is_active = true
             ORDER BY pm.position ASC
             LIMIT $3
           ) x
         ), ARRAY[]::text[]) AS image_paths
       FROM ${TABLES_ENUM.PORTFOLIOS} p
       INNER JOIN ${TABLES_ENUM.USERS} u ON u.id = p.user_id
       WHERE p.blocked_at IS NULL AND p.is_active = true AND p.is_indexable = true
       ORDER BY p.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, imageCap],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : []).map(
      (row: { username: string; slug: string; updated_at: string; image_paths: string[] | null }) => ({
        username: row.username,
        slug: row.slug,
        updated_at: row.updated_at,
        image_paths: row.image_paths ?? [],
      }),
    );
  }

  /** Count for `getSitemapPortfolios` (same predicate). */
  async countSitemapPortfolios(): Promise<number> {
    const result = await Query.raw(
      `SELECT COUNT(*)::int AS count FROM ${TABLES_ENUM.PORTFOLIOS}
       WHERE blocked_at IS NULL AND is_active = true AND is_indexable = true`,
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return Number((Array.isArray(rows) ? rows : [])[0]?.count ?? 0);
  }

  /**
   * Persist the EN-fallback SEO onto the main row and stamp `seo_generated_at`.
   * `seo_generated_at` is set to DB `CURRENT_TIMESTAMP` in the same statement so it equals the
   * `updated_at` value the BEFORE-UPDATE trigger writes — otherwise `seo_generated_at < updated_at`
   * would stay true and the row would be regenerated on every batch run forever.
   */
  async updateSeoById(id: number, seo: EntitySeoFields): Promise<void> {
    await Query.raw(
      `UPDATE ${TABLES_ENUM.PORTFOLIOS}
       SET seo_title = $1, seo_description = $2, seo_generated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [seo.seo_title ?? null, seo.seo_description ?? null, id],
    );
  }

  /**
   * Lean SEO-only read for `generateMetadata`: returns the portfolio's SEO localized to the request
   * language (COALESCE translation → main-row EN fallback) plus the cover thumbnail and index flag.
   * Does NOT fetch media/layout/collections (that is the render fetch's job).
   */
  async getSeoMetadataBySlug(
    slug: string,
    userId: number,
  ): Promise<{
    seo_title: string | null;
    seo_description: string | null;
    thumbnail: string | null;
    is_indexable: boolean;
  } | null> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const result = await Query.raw(
      `SELECT p.thumbnail, p.is_indexable,
              COALESCE(pt.seo_title, p.seo_title) AS seo_title,
              COALESCE(pt.seo_description, p.seo_description) AS seo_description
       FROM ${TABLES_ENUM.PORTFOLIOS} p
       LEFT JOIN ${TABLES_ENUM.PORTFOLIO_TRANSLATIONS} pt
         ON pt.portfolio_id = p.id AND pt.language_code = $1
       WHERE p.slug = $2 AND p.user_id = $3 AND p.blocked_at IS NULL
       LIMIT 1`,
      [lang, slug, userId],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    const row = (Array.isArray(rows) ? rows : [])[0] as
      | { seo_title: string | null; seo_description: string | null; thumbnail: string | null; is_indexable: boolean }
      | undefined;
    if (!row) return null;
    return {
      seo_title: row.seo_title ?? null,
      seo_description: row.seo_description ?? null,
      thumbnail: row.thumbnail ?? null,
      is_indexable: row.is_indexable,
    };
  }

  /** Upsert per-locale SEO rows into portfolio_translations (one row per app language). */
  async upsertSeoTranslations(portfolioId: number, rows: SeoTranslation[]): Promise<void> {
    for (const r of rows) {
      await Query.raw(
        `INSERT INTO ${TABLES_ENUM.PORTFOLIO_TRANSLATIONS} (language_code, portfolio_id, seo_title, seo_description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (language_code, portfolio_id)
         DO UPDATE SET seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description`,
        [r.language_code, portfolioId, r.seo_title ?? null, r.seo_description ?? null],
      );
    }
  }

  async getFeatured(): Promise<FullPortfolio | null> {
    const result = await this.applyFullPortfolioQuery(this.query())
      .where('portfolios.is_featured', '=', true)
      .where('portfolios.is_active', '=', true)
      .where('portfolios.blocked_at', 'IS', null)
      .orderBy('portfolios.created_at', 'DESC')
      .orderBy('portfolios.id', 'DESC')
      .orderBy('portfolio_media.position', 'ASC')
      .get<PortfolioFullSchema[]>();

    if (!result?.length) return null;

    const featuredId = result[0].id;
    const rows = result.filter((row) => row.id === featuredId);
    return this.formatFullPortfolio(rows);
  }

  private applyFullPortfolioQuery(query: QueryBuilder): QueryBuilder {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    return query
      .rawSelect(
        [
          ...this.FULL_COLUMNS,
          `COALESCE(category_translations.name, categories.name) as c_name`,
          `categories.type as c_type`,
        ].join(','),
      )
      .join('portfolios.user_id', 'users', 'id', 'INNER')
      .join('portfolios.id', 'portfolio_media', 'portfolio_id', 'LEFT')
      .join('portfolio_media.media_id', 'media', 'id', 'LEFT')
      .join('portfolios.id', 'portfolio_categories', 'portfolio_id', 'LEFT')
      .join('portfolio_categories.category_id', 'categories', 'id', 'LEFT')
      .join(
        'categories.id',
        TABLES_ENUM.CATEGORY_TRANSLATIONS,
        'category_id',
        'LEFT',
        `AND category_translations.language_code = '${lang}'`,
      )
      .join('portfolios.id', TABLES_ENUM.LAYOUT_CONFIG, 'portfolio_id', 'LEFT')
      .join('layout_config.layout_id', TABLES_ENUM.LAYOUTS, 'id', 'LEFT')
      .where('media.thumbnail', 'IS NOT', null)
      .where('media.blocked_at', null);
  }

  async getOneCompact(id: number): Promise<Portfolio | null> {
    const result = await this.getOneWithArtist(id);
    return result ? this.formatPortfolio(result) : null;
  }

  private async getOneWithArtist(id: number): Promise<PortfolioWithArtistSchema | null> {
    return this.query()
      .select(this.COLUMNS)
      .join('portfolios.user_id', 'users', 'id', 'INNER')
      .where('portfolios.id', '=', id)
      .first<PortfolioWithArtistSchema>();
  }

  async slugExists(slug: string, userId: number): Promise<boolean> {
    const result = await this.query()
      .where('slug', slug)
      .where('user_id', userId)
      .exists();

    return !!result;
  }

  /**
   * Titles are unique per user, never globally — two artists may both call a portfolio
   * "Sketchbook 2026"; their public URLs differ by username. Matched case-insensitively and
   * trimmed, so "My Work" and " my work " collide (they would otherwise produce near-identical
   * entries with confusingly divergent slugs). Pass `excludeId` on update to skip the row itself.
   */
  async titleExists(title: string, userId: number, excludeId?: number): Promise<boolean> {
    const query = this.query()
      .where('LOWER(TRIM(portfolios.title))', '=', title.trim().toLowerCase())
      .where('user_id', '=', userId);

    if (excludeId != null) query.where('id', '!=', excludeId);

    return !!(await query.exists());
  }

  async countHighlights(userId: number): Promise<number> {
    return this.query()
      .where('user_id', '=', userId)
      .where('is_highlight', '=', true)
      .count();
  }

  async findCategoriesForPortfolio(portfolioId: number): Promise<CategoryBase[]> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const rows = await this.query()
      .rawSelect(
        `categories.id,
         categories.tags,
         categories.thumbnail,
         categories.is_featured,
         categories.is_active,
         categories.type,
         categories.parent_id,
         COALESCE(category_translations.name, categories.name) AS name,
         categories.slug`,
      )
      .join('id', 'portfolio_categories', 'portfolio_id', 'INNER')
      .join('portfolio_categories.category_id', 'categories', 'id', 'INNER')
      .join(
        'categories.id',
        TABLES_ENUM.CATEGORY_TRANSLATIONS,
        'category_id',
        'LEFT',
        `AND category_translations.language_code = '${lang}'`,
      )
      .where('portfolio_categories.portfolio_id', '=', portfolioId)
      .get<{
        id: number;
        tags: string | null;
        thumbnail: string | null;
        is_featured: boolean;
        is_active: boolean;
        type: EnumType<'CATEGORY_TYPE'>;
        parent_id: number | null;
        name: string;
        slug: string;
      }[]>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      tags: row.tags ? row.tags.split(',') : [],
      thumbnail: row.thumbnail,
      parent_id: row.parent_id,
      is_featured: row.is_featured,
      is_active: row.is_active,
      type: row.type,
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create({ media, collections, categories, layout: _layout, ...portfolioData }: CreatePortfolioInput): Promise<Portfolio> {
    const cols = Object.keys(portfolioData);
    const values = Object.values(portfolioData);

    // First create the portfolio base data
    const portfolioResult = await this.query().insertAndGet<PortfolioSchema>(cols, values);
    if (!portfolioResult) {
      throw new DbException('Could not create portfolio');
    }


    await this.attachRelations(portfolioResult.id, {
      media,
      collections,
      categories,
    });

    return this.formatPortfolio(await this.getOneWithArtist(portfolioResult.id));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateById(id: number, { media, collections, categories, layout: _layout, ...portfolioData }: UpdatePortfolioInput): Promise<Portfolio> {
    const cols = Object.keys(portfolioData);
    const values = Object.values(portfolioData) as string[];

    // Update portfolio base data if any scalar fields changed
    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }

    // Re-attach media and collection relations in parallel
    await this.attachRelations(id, {
      media,
      collections,
      categories,
    });

    // Return the updated portfolio
    const result = await this.getOneWithArtist(id);

    if (!result) {
      throw new DbException('Could not update portfolio');
    }

    return this.formatPortfolio(result);
  }

  private async attachRelations(portfolioId: number, { media, collections, categories }: {
    media?: {
      id: number;
      position: number;
    }[];
    collections?: {
      id: number;
      position: number;
    }[];
    categories?: number[];
  }) {
    // Attach media and collection relations in parallel
    const attachPromises: Promise<unknown>[] = [];

    if (media) {
      attachPromises.push(
        this.attach('portfolio_media', {
          modelCol: 'portfolio_id',
          modelValue: portfolioId,
          attachCol: 'media_id',
          valuesToAttach: media.map(m => ({
            value: m.id,
            columns: {
              'position': m.position,
            },
          })),
          removePrevious: true,
        })
      );
    }

    if (collections) {
      attachPromises.push(
        this.attach('portfolio_collection', {
          modelCol: 'portfolio_id',
          modelValue: portfolioId,
          attachCol: 'collection_id',
          valuesToAttach: collections.map(c => ({
            value: c.id,
            columns: {
              'position': c.position,
            },
          })),
          removePrevious: true,
        })
      );
    }

    if (categories !== undefined) {
      attachPromises.push(
        this.attach('portfolio_categories', {
          modelCol: 'portfolio_id',
          modelValue: portfolioId,
          attachCol: 'category_id',
          valuesToAttach: categories,
          removePrevious: true,
        }),
      );
    }

    await Promise.all(attachPromises);
  }
  async delete(id: number) {

    return await this.query().where('id', '=', id).delete()

  }

  protected async applyFilters(
    filters: PortfolioIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query
      .select(this.COLUMNS)
      .join('portfolios.user_id', 'users', 'id', 'INNER')
      .join('users.id', 'addresses', 'user_id', 'LEFT');

    if (filters.user_id) {
      query.where('portfolios.user_id', '=', filters.user_id);
    }

    if (typeof filters.is_featured === 'boolean') {
      query.where('portfolios.is_featured', '=', filters.is_featured);
    }

    if (typeof filters.is_highlight === 'boolean') {
      query.where('portfolios.is_highlight', '=', filters.is_highlight);
    }

    if (typeof filters.is_active === 'boolean') {
      query.where('portfolios.is_active', '=', filters.is_active);
    }

    if (typeof filters.blocked === 'boolean') {
      if (filters.blocked) {
        query.where('portfolios.blocked_at', 'IS NOT', null);
      } else {
        query.where('portfolios.blocked_at', 'IS', null);
      }
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      query.whereGroup([
        ['portfolios.title', 'ILIKE', `%${search}%`, 'where'],
        ['users.username', 'ILIKE', `%${search}%`, 'orWhere'],
        ['users.name', 'ILIKE', `%${search}%`, 'orWhere'],
        ['users.surname', 'ILIKE', `%${search}%`, 'orWhere'],
      ]);
    }

    if (filters.categories?.length) {
      const pivotRows = await this.query()
        .rawSelect('DISTINCT portfolio_categories.portfolio_id')
        .join('id', 'portfolio_categories', 'portfolio_id', 'INNER')
        .join('portfolio_categories.category_id', 'categories', 'id', 'INNER')
        .whereIn('categories.slug', filters.categories)
        .get<{ portfolio_id: number }[]>();

      const portfolioIds = pivotRows.map((r) => r.portfolio_id);
      if (portfolioIds.length) {
        query.whereIn('portfolios.id', portfolioIds);
      } else {
        query.where('portfolios.id', '=', -1);
      }
    }

    const cityFilter = filters.city?.trim();
    if (cityFilter) {
      query.where(
        'unaccent(addresses.city)',
        'ILIKE',
        `%${foldLatinDiacriticsForMatch(cityFilter)}%`,
      );
    }

    const stateFilter = filters.state?.trim();
    if (stateFilter) {
      query.where(
        'unaccent(addresses.state)',
        'ILIKE',
        `%${foldLatinDiacriticsForMatch(stateFilter)}%`,
      );
    }

    const countryFilter = filters.country?.trim();
    if (countryFilter) {
      query.where(
        'unaccent(addresses.country)',
        'ILIKE',
        `%${foldLatinDiacriticsForMatch(countryFilter)}%`,
      );
    }

    if (filters.lat != null && filters.lng != null) {
      const radius = filters.radius_km ?? 50;
      query
        .withinRadius('addresses.latitude', 'addresses.longitude', filters.lat, filters.lng, radius)
        .orderByDistance('addresses.latitude', 'addresses.longitude', filters.lat, filters.lng, 'ASC');
    }

    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);
    query.orderBy('portfolios.created_at', 'DESC');
    query.orderBy('portfolios.id', 'DESC');

    return query;
  }

  private formatPortfolio(result: PortfolioWithArtistSchema): Portfolio {
    return {
      id: result.id,
      slug: result.slug,
      title: result.title,
      thumbnail: result.thumbnail,
      description: result.description,
      is_featured: result.is_featured,
      is_highlight: result.is_highlight,
      is_active: result.is_active,
      is_indexable: result.is_indexable,
      seo_title: result.seo_title,
      seo_description: result.seo_description,
      seo_generated_at: result.seo_generated_at,
      blocked_at: result.blocked_at,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
      artist: this.formatArtist(result),
    };
  }

  private formatArtist(result: PortfolioWithArtistSchema): CompactUser {
    return {
      id: result.u_id,
      email: result.email,
      username: result.username,
      name: result.name,
      surname: result.surname,
      benefit_id: result.benefit_id,
      language: result.language,
    };
  }
  private formatFullPortfolio(result: PortfolioFullSchema[]): FullPortfolio {
    const mediaMap = new Map<number, MediaPortfolio>();
    const categoriesMap = new Map<number, CategoryBase>();

    for (const row of result) {
      if (row.m_id && !mediaMap.has(row.m_id)) {
        mediaMap.set(row.m_id, {
          id: row.m_id,
          public_id: row.public_id,
          title: row.m_title,
          position: row.position,
          thumbnail: row.m_thumbnail,
          url: row.url,
          seo_filename: row.seo_filename,
          seo_alt: row.seo_alt,
          seo_description: row.m_seo_description,
          seo_title: row.m_seo_title,
          shape: row.shape,
          aspect_ratio: row.aspect_ratio ?? '1:1',
          is_highlight: row.m_is_highlight ?? false,
        });
      }

      if (row.c_id && !categoriesMap.has(row.c_id)) {
        categoriesMap.set(row.c_id, {
          id: row.c_id,
          name: row.c_name ?? '',
          slug: row.c_slug ?? '',
          tags: [],
          thumbnail: null,
          parent_id: null,
          is_featured: row.c_is_featured ?? false,
          is_active: row.c_is_active ?? true,
          type: row.c_type ?? 'DISCIPLINE',
        });
      }
    }

    const first = result[0];

    return {
      id: first.id,
      slug: first.slug,
      title: first.title,
      thumbnail: first.thumbnail,
      description: first.description,
      is_featured: first.is_featured,
      is_highlight: first.is_highlight,
      is_active: first.is_active,
      is_indexable: first.is_indexable,
      seo_title: first.seo_title,
      seo_description: first.seo_description,
      seo_generated_at: first.seo_generated_at,
      blocked_at: first.blocked_at,
      user_id: first.user_id,
      created_at: first.created_at,
      updated_at: first.updated_at,
      artist: this.formatArtist(first),
      media: Array.from(mediaMap.values()),
      collections: [],
      categories: Array.from(categoriesMap.values()),
      layout: formatPortfolioLayout(first),
    };
  }
}
