import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { Query } from '@repo/database/facades';
import {
  CollectionCompactSchema,
  CollectionFullSchema,
  CollectionFullSchemaColumns,
  CollectionSchema,
  CollectionSchemaColumns,
  FullPortfolioCollectionSchema,
  FullPortfolioCollectionSchemaColumns,
} from '@repo/common-lib/schemas/collection';
import {
  CreateCollectionInput,
  UpdateCollectionInput,
  FullCollection,
  Collection,
  CollectionIndexRequest,
  CollectionMedia,
  FullCollectionMedia,
  FullPortfolioCollection,
} from '@repo/common-lib/types/collection';
import { EntitySeoFields, SeoTranslation } from '@repo/common-lib/types/ai';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { DbException } from '@repo/database/exceptions';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class CollectionRepository extends BaseRepository {
  private readonly BASE_COLUMNS: CollectionSchemaColumns[] = [
    'collections.id',
    'collections.slug',
    'collections.title',
    'collections.is_featured',
    'collections.is_highlight',
    'collections.is_active',
    'collections.is_indexable',
    'collections.seo_title',
    'collections.seo_description',
    'collections.seo_generated_at',
    'collections.description',
    'collections.blocked_at',
    'collections.user_id',
    'collections.created_at',
    'collections.updated_at',
  ];

  private readonly COLUMNS: CollectionFullSchemaColumns[] = [
    ...this.BASE_COLUMNS,
    'collection_media.position',
    'media.id as m_id',
    'media.thumbnail',
    'media.title as m_title',
  ] as const;


  private readonly FULL_COLUMNS: CollectionFullSchemaColumns[] = [
    ...this.BASE_COLUMNS,
    'collection_media.position',
    'media.id as m_id',
    'media.public_id',
    'media.thumbnail',
    'media.url',
    'media.shape',
    'media.aspect_ratio',
    'media.title as m_title',
    'media.seo_title as m_seo_title',
    'media.seo_alt',
    'media.seo_filename',
    'media.seo_description as m_seo_description',
  ];

  constructor(private readonly requestService: RequestService, protected readonly logService: LogService) {
    super('collections', logService);
  }

  async getAll(filters: CollectionIndexRequest): Promise<Collection[]> {
    if (filters.paginated) {
      return this.getAllPaginated(filters);
    }
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<CollectionCompactSchema[]>();
    return this.formatCollections(results);
  }

  /**
   * Two-phase query: paginate on the base table first (1 row per collection),
   * then fetch media for the paginated IDs. This avoids the JOIN row-multiplication
   * bug where LIMIT operates on rows instead of distinct collections.
   */
  private async getAllPaginated(filters: CollectionIndexRequest): Promise<Collection[]> {
    const baseQuery = this.query().select(this.BASE_COLUMNS);
    this.applyWhereFilters(baseQuery, filters);
    this.requestService.pagination =
      await this.handleOffsetPagination(baseQuery, filters);
    baseQuery.orderBy('created_at', 'DESC');
    const baseResults = await baseQuery.get<CollectionSchema[]>();

    if (!baseResults.length) return [];

    const ids = baseResults.map((r) => r.id);

    const result = await this.query()
      .select(this.COLUMNS)
      .whereIn('collections.id', ids)
      .join('id', 'collection_media', 'collection_id', 'LEFT')
      .join('collection_media.media_id', 'media', 'id', 'LEFT')
      .where('media.thumbnail', 'IS NOT', null)
      .where('media.blocked_at', null)
      .orderBy('created_at', 'DESC')
      .orderBy('collection_media.position', 'ASC')
      .get<CollectionCompactSchema[]>();

    return this.formatCollections(result);
  }

  async getBySlug(slug: string, userId: number): Promise<FullCollection> {
    const result = await this.query()
      .select(this.FULL_COLUMNS)
      .where('slug', '=', slug)
      .where('user_id', '=', userId)
      .join('id', 'collection_media', 'collection_id', 'LEFT')
      .join('collection_media.media_id', 'media', 'id', 'LEFT')
      .where('media.thumbnail', 'IS NOT', null)
      .where('media.blocked_at', 'IS', null)
      .orderBy('collection_media.position', 'ASC')
      .get<CollectionFullSchema[]>();

    if (!result || (Array.isArray(result) && result.length === 0)) return null;
    return this.formatFullCollection(Array.isArray(result) ? result : [result]);
  }

  async getFullById(id: number): Promise<FullCollection | null> {
    const result = await this.query()
      .select(this.FULL_COLUMNS)
      .where('collections.id', '=', id)
      .join('id', 'collection_media', 'collection_id', 'LEFT')
      .join('collection_media.media_id', 'media', 'id', 'LEFT')
      .where('media.thumbnail', 'IS NOT', null)
      .where('media.blocked_at', 'IS', null)
      .orderBy('collection_media.position', 'ASC')
      .get<CollectionFullSchema[]>();

    if (!result || (Array.isArray(result) && result.length === 0)) {
      // Still return base collection when it has no media yet
      const base = await this.query()
        .select(this.BASE_COLUMNS)
        .where('id', '=', id)
        .first<CollectionSchema>();
      return base ? { ...this.formatBaseCollection(base), media: [] } : null;
    }
    return this.formatFullCollection(Array.isArray(result) ? result : [result]);
  }

  /** Collections with no SEO yet, or content newer than last SEO generation. */
  async findDueForSeoGeneration(): Promise<{ id: number; user_id: number }[]> {
    const result = await Query.raw(
      `SELECT id, user_id
       FROM ${TABLES_ENUM.COLLECTIONS}
       WHERE blocked_at IS NULL
         AND is_active = true
         AND is_indexable = true
         AND (seo_generated_at IS NULL OR seo_generated_at < updated_at)
       ORDER BY updated_at ASC`,
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : []).map((row: { id: number; user_id: number }) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
    }));
  }

  /**
   * Sitemap enumeration: publicly indexable collections + owner username + up to `imageCap` gallery
   * thumbnail PATHS (ordered by pivot position). Same visibility predicate as
   * `findDueForSeoGeneration`. Paths are signed into URLs by the sitemap service.
   */
  async getSitemapCollections(
    limit: number,
    offset: number,
    imageCap: number,
  ): Promise<{ username: string; slug: string; updated_at: string; image_paths: string[] }[]> {
    const result = await Query.raw(
      `SELECT c.slug, c.updated_at, u.username,
         COALESCE((
           SELECT array_agg(x.thumbnail)
           FROM (
             SELECT m.thumbnail
             FROM ${TABLES_ENUM.COLLECTION_MEDIA} cm
             JOIN ${TABLES_ENUM.MEDIA} m ON m.id = cm.media_id
             WHERE cm.collection_id = c.id
               AND m.thumbnail IS NOT NULL AND m.blocked_at IS NULL AND m.is_active = true
             ORDER BY cm.position ASC
             LIMIT $3
           ) x
         ), ARRAY[]::text[]) AS image_paths
       FROM ${TABLES_ENUM.COLLECTIONS} c
       INNER JOIN ${TABLES_ENUM.USERS} u ON u.id = c.user_id
       WHERE c.blocked_at IS NULL AND c.is_active = true AND c.is_indexable = true
       ORDER BY c.updated_at DESC
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

  /** Count for `getSitemapCollections` (same predicate). */
  async countSitemapCollections(): Promise<number> {
    const result = await Query.raw(
      `SELECT COUNT(*)::int AS count FROM ${TABLES_ENUM.COLLECTIONS}
       WHERE blocked_at IS NULL AND is_active = true AND is_indexable = true`,
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return Number((Array.isArray(rows) ? rows : [])[0]?.count ?? 0);
  }

  /**
   * Persist the EN-fallback SEO onto the main row and stamp `seo_generated_at` via DB
   * `CURRENT_TIMESTAMP` (same statement) so it equals the trigger-set `updated_at` and the row
   * settles instead of being regenerated on every batch run.
   */
  async updateSeoById(id: number, seo: EntitySeoFields): Promise<void> {
    await Query.raw(
      `UPDATE ${TABLES_ENUM.COLLECTIONS}
       SET seo_title = $1, seo_description = $2, seo_generated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [seo.seo_title ?? null, seo.seo_description ?? null, id],
    );
  }

  /** Lean SEO-only read for `generateMetadata`, localized to the request language. */
  async getSeoMetadataBySlug(
    slug: string,
    userId: number,
  ): Promise<{ seo_title: string | null; seo_description: string | null; is_indexable: boolean } | null> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const result = await Query.raw(
      `SELECT c.is_indexable,
              COALESCE(ct.seo_title, c.seo_title) AS seo_title,
              COALESCE(ct.seo_description, c.seo_description) AS seo_description
       FROM ${TABLES_ENUM.COLLECTIONS} c
       LEFT JOIN ${TABLES_ENUM.COLLECTION_TRANSLATIONS} ct
         ON ct.collection_id = c.id AND ct.language_code = $1
       WHERE c.slug = $2 AND c.user_id = $3 AND c.blocked_at IS NULL
       LIMIT 1`,
      [lang, slug, userId],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    const row = (Array.isArray(rows) ? rows : [])[0] as
      | { seo_title: string | null; seo_description: string | null; is_indexable: boolean }
      | undefined;
    if (!row) return null;
    return {
      seo_title: row.seo_title ?? null,
      seo_description: row.seo_description ?? null,
      is_indexable: row.is_indexable,
    };
  }

  /**
   * Distinct content TAGS across the collection's media, localized to the request language
   * (COALESCE translation → English name). Feeds `CollectionPage.keywords` — collections carry no
   * categories of their own, so their keywords aggregate the media's LLM-assigned tags.
   */
  async getTagsByCollectionId(collectionId: number): Promise<string[]> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const result = await Query.raw(
      `SELECT DISTINCT COALESCE(ct.name, c.name) AS name
       FROM ${TABLES_ENUM.COLLECTION_MEDIA} cm
       INNER JOIN ${TABLES_ENUM.MEDIA_CATEGORIES} mc ON mc.media_id = cm.media_id
       INNER JOIN ${TABLES_ENUM.CATEGORIES} c
         ON c.id = mc.category_id AND c.type = 'TAGS' AND c.is_active = true
       LEFT JOIN ${TABLES_ENUM.CATEGORY_TRANSLATIONS} ct
         ON ct.category_id = c.id AND ct.language_code = $1
       WHERE cm.collection_id = $2
       ORDER BY name
       LIMIT 15`,
      [lang, collectionId],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : [])
      .map((r) => (r as { name?: string | null }).name)
      .filter((n): n is string => !!n);
  }

  /** Upsert per-locale SEO rows into collection_translations (one row per app language). */
  async upsertSeoTranslations(collectionId: number, rows: SeoTranslation[]): Promise<void> {
    for (const r of rows) {
      await Query.raw(
        `INSERT INTO ${TABLES_ENUM.COLLECTION_TRANSLATIONS} (language_code, collection_id, seo_title, seo_description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (language_code, collection_id)
         DO UPDATE SET seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description`,
        [r.language_code, collectionId, r.seo_title ?? null, r.seo_description ?? null],
      );
    }
  }

  async getOneCompact(id: number) {
    const result = await this.query().select(this.BASE_COLUMNS).where('id', '=', id).first<CollectionSchema>();
    return result ? this.formatBaseCollection(result) : null;
  }

  async slugExists(slug: string, userId: number): Promise<boolean> {
    const result = await this.query()
      .where('slug', '=', slug)
      .where('user_id', '=', userId)
      .exists();

    return !!result;
  }

  async countHighlights(userId: number): Promise<number> {
    return this.query()
      .where('user_id', '=', userId)
      .where('is_highlight', '=', true)
      .count();
  }

  async create({ media, ...collectionData }: CreateCollectionInput): Promise<Collection> {
    const cols = Object.keys(collectionData);
    const values = Object.values(collectionData);

    const collectionResult = await this.query().insertAndGet<CollectionSchema>(cols, values);
    if (!collectionResult) {
      throw new DbException('Could not create collection');
    }

    if (media?.length) {
      await this.attachMedia(collectionResult.id, media);
    }

    return { ...collectionResult, media: [] };
  }

  async updateById(id: number, { media, ...collectionData }: UpdateCollectionInput): Promise<Collection> {
    const cols = Object.keys(collectionData);
    const values = Object.values(collectionData) as string[];

    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }

    await this.attachMedia(id, media);

    const result = await this.query()
      .select(this.BASE_COLUMNS)
      .where('id', '=', id)
      .first<CollectionSchema>();

    if (!result) {
      throw new DbException('Could not update collection');
    }

    return this.formatBaseCollection(result);
  }

  private async attachMedia(collectionId: number, media: { id: number; position: number }[]) {
    await this.attach('collection_media', {
      modelCol: 'collection_id',
      modelValue: collectionId,
      attachCol: 'media_id',
      valuesToAttach: media.map(m => ({
        value: m.id,
        columns: {
          'position': m.position,
        },
      })),
      removePrevious: true,
    });
  }

  async delete(id: number) {
    return await this.query().where('id', '=', id).delete();
  }

  private applyWhereFilters(query: QueryBuilder, filters: CollectionIndexRequest): void {
    if (filters.user_id) {
      query.where('user_id', '=', filters.user_id);
    }
    if (typeof filters.is_featured === 'boolean') {
      query.where('is_featured', '=', filters.is_featured);
    }
    if (typeof filters.is_highlight === 'boolean') {
      query.where('is_highlight', '=', filters.is_highlight);
    }
    if (typeof filters.is_active === 'boolean') {
      query.where('is_active', '=', filters.is_active);
    }
    if (typeof filters.blocked === 'boolean') {
      if (filters.blocked) {
        query.where('blocked_at', 'IS NOT', null);
      } else {
        query.where('blocked_at', 'IS', null);
      }
    }
  }

  public async getPortfolioCollections(portfolioId: number): Promise<FullPortfolioCollection[]> {
    const PORTFOLIO_COLS: FullPortfolioCollectionSchemaColumns[] = [
      'portfolio_collection.position as pc_position',
    ];

    const rows = await this.query()
      .select([...this.FULL_COLUMNS, ...PORTFOLIO_COLS])
      .join('id', 'portfolio_collection', 'collection_id', 'LEFT')
      .join('id', 'collection_media', 'collection_id', 'LEFT')
      .join('collection_media.media_id', 'media', 'id', 'LEFT')
      .where('portfolio_collection.portfolio_id', portfolioId)
      .where('media.thumbnail', 'IS NOT', null)
      .where('media.blocked_at', 'IS', null)
      .orderBy('portfolio_collection.position', 'ASC')
      .orderBy('collection_media.position', 'ASC')
      .get<FullPortfolioCollectionSchema[]>();

    return this.formatPortfolioCollections(rows);
  }

  private formatPortfolioCollections(rows: FullPortfolioCollectionSchema[]): FullPortfolioCollection[] {
    const map = new Map<number, FullPortfolioCollection>();

    for (const row of rows) {
      let collection = map.get(row.id);
      if (!collection) {
        collection = {
          id: row.id,
          slug: row.slug,
          title: row.title,
          is_featured: row.is_featured,
          is_highlight: row.is_highlight,
          is_active: row.is_active,
          is_indexable: row.is_indexable,
          seo_title: row.seo_title,
          seo_description: row.seo_description,
          seo_generated_at: row.seo_generated_at,
          description: row.description,
          blocked_at: row.blocked_at,
          user_id: row.user_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          position: row.pc_position,
          media: [],
        };
        map.set(row.id, collection);
      }

      if (row.m_id && !collection.media.some((m) => m.id === row.m_id)) {
        collection.media.push({
          id: row.m_id,
          public_id: row.public_id,
          title: row.m_title,
          position: row.position,
          thumbnail: row.thumbnail,
          url: row.url,
          seo_filename: row.seo_filename,
          seo_title: row.m_seo_title,
          seo_alt: row.seo_alt,
          seo_description: row.m_seo_description,
          shape: row.shape,
          aspect_ratio: row.aspect_ratio ?? '1:1',
          is_highlight: row.is_highlight
        });
      }
    }

    return Array.from(map.values());
  }

  protected async applyFilters(
    filters: CollectionIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.select(this.COLUMNS)
      .join('id', 'collection_media', 'collection_id', 'LEFT')
      .join('collection_media.media_id', 'media', 'id', 'LEFT')
      .where('media.thumbnail', 'IS NOT', null)
      .where('media.blocked_at', 'IS', null)

    this.applyWhereFilters(query, filters);

    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);
    query.orderBy('created_at', 'DESC');
    query.orderBy('collection_media.position', 'ASC');

    return query;
  }

  private formatBaseCollection(result: CollectionSchema): Collection {
    return {
      id: result.id,
      slug: result.slug,
      title: result.title,
      is_featured: result.is_featured,
      is_highlight: result.is_highlight,
      is_active: result.is_active,
      is_indexable: result.is_indexable,
      seo_title: result.seo_title,
      seo_description: result.seo_description,
      seo_generated_at: result.seo_generated_at,
      description: result.description,
      blocked_at: result.blocked_at,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
      media: [],
    };
  }

  private formatCollections(rows: CollectionCompactSchema[]): Collection[] {
    const map = new Map<number, Collection>();

    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          slug: row.slug,
          title: row.title,
          is_featured: row.is_featured,
          is_highlight: row.is_highlight,
          is_active: row.is_active,
          is_indexable: row.is_indexable,
          seo_title: row.seo_title,
          seo_description: row.seo_description,
          seo_generated_at: row.seo_generated_at,
          description: row.description,
          blocked_at: row.blocked_at,
          user_id: row.user_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          media: [],
        });
      }

      if (row.m_id) {
        const media: CollectionMedia = {
          id: row.m_id,
          thumbnail: row.thumbnail,
          title: row.m_title,
          position: row.position,
        };
        map.get(row.id)!.media.push(media);
      }
    }

    return Array.from(map.values());
  }

  private formatFullCollection(result: CollectionFullSchema[]): FullCollection {
    const mediaMap = new Map<number, FullCollectionMedia>();

    for (const row of result) {
      if (!row.m_id || mediaMap.has(row.m_id)) continue;

      mediaMap.set(row.m_id, {
        id: row.m_id,
        public_id: row.public_id,
        title: row.m_title,
        position: row.position,
        thumbnail: row.thumbnail,
        url: row.url,
        seo_title: row.m_seo_title,
        seo_filename: row.seo_filename,
        seo_alt: row.seo_alt,
        seo_description: row.m_seo_description,
        shape: row.shape,
        aspect_ratio: row.aspect_ratio ?? '1:1',
        is_highlight: row.is_highlight
      });
    }

    const first = result[0];

    return {
      id: first.id,
      slug: first.slug,
      title: first.title,
      is_featured: first.is_featured,
      is_highlight: first.is_highlight,
      is_active: first.is_active,
      is_indexable: first.is_indexable,
      seo_title: first.seo_title,
      seo_description: first.seo_description,
      seo_generated_at: first.seo_generated_at,
      description: first.description,
      blocked_at: first.blocked_at,
      user_id: first.user_id,
      created_at: first.created_at,
      updated_at: first.updated_at,
      media: Array.from(mediaMap.values()),
    };
  }
}
