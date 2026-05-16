import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
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
    'media.title as m_title',
    'media.seo_title',
    'media.seo_alt',
    'media.seo_title',
    'media.seo_filename',
    'media.seo_description',
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
          seo_title: row.seo_title,
          seo_alt: row.seo_alt,
          seo_description: row.seo_description,
          shape: row.shape,
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
        seo_title: row.seo_title,
        seo_filename: row.seo_filename,
        seo_alt: row.seo_alt,
        seo_description: row.seo_description,
        shape: row.shape,
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
      description: first.description,
      blocked_at: first.blocked_at,
      user_id: first.user_id,
      created_at: first.created_at,
      updated_at: first.updated_at,
      media: Array.from(mediaMap.values()),
    };
  }
}
