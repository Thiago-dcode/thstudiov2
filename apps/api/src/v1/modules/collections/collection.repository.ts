import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import {
  CollectionFullSchema,
  CollectionFullSchemaColumns,
  CollectionSchema,
  CollectionSchemaColumns,
} from '@repo/common-lib/schemas/collection';
import {
  CreateCollectionInput,
  UpdateCollectionInput,
  FullCollection,
  Collection,
  CollectionIndexRequest,
} from '@repo/common-lib/types/collection';
import { DbException } from '@repo/database/exceptions';
import { RequestService } from 'src/common/services/request.service';
import { MediaPortfolio } from '@repo/common-lib/types/media';

@Injectable()
export class CollectionRepository extends BaseRepository {
  private readonly COLUMNS: CollectionSchemaColumns[] = [
    'collections.id',
    'collections.slug',
    'collections.title',
    'collections.is_featured',
    'collections.is_highlight',
    'collections.description',
    'collections.user_id',
    'collections.created_at',
    'collections.updated_at',
  ] as const;

  private readonly FULL_COLUMNS: CollectionFullSchemaColumns[] = [
    ...this.COLUMNS,
    'collection_media.media_id',
    'collection_media.position',
    'media.id as m_id',
    'media.public_id',
    'media.thumbnail',
    'media.url',
    'media.shape',
    'media.title as m_title',
    'media.seo_alt',
    'media.seo_filename',
    'media.seo_description',
    'media.seo_title',
    'media.is_featured as m_is_featured',
    'media.is_highlight as m_is_highlight',
  ];

  constructor(private readonly requestService: RequestService) {
    super('collections');
  }

  async getAll(filters: CollectionIndexRequest): Promise<Collection[]> {
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<CollectionSchema[]>();
    return results.map((result) => this.formatCollection(result));
  }

  async getBySlug(slug: string, userId: number): Promise<FullCollection> {
    const result = await this.query()
      .select(this.FULL_COLUMNS)
      .where('slug', '=', slug)
      .where('user_id', '=', userId)
      .join('id', 'collection_media', 'collection_id', 'LEFT')
      .join('collection_media.media_id', 'media', 'id', 'LEFT')
      .get<CollectionFullSchema[]>();

    if (!result || (Array.isArray(result) && result.length === 0)) return null;
    return this.formatFullCollection(Array.isArray(result) ? result : [result]);
  }

  async getOneCompact(id: number) {
    const result = await this.query().select(this.COLUMNS).where('id', '=', id).first();
    return result ? this.formatCollection(result) : null;
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

    return collectionResult;
  }

  async updateById(id: number, { media, ...collectionData }: UpdateCollectionInput): Promise<Collection> {
    const cols = Object.keys(collectionData);
    const values = Object.values(collectionData) as string[];

    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }

    await this.attachMedia(id, media);

    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<CollectionSchema>();

    if (!result) {
      throw new DbException('Could not update collection');
    }

    return this.formatCollection(result);
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

  protected async applyFilters(
    filters: CollectionIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.select(this.COLUMNS);

    if (filters.user_id) {
      query.where('user_id', '=', filters.user_id);
    }

    if (typeof filters.is_featured === 'boolean') {
      query.where('is_featured', '=', filters.is_featured);
    }

    if (typeof filters.is_highlight === 'boolean') {
      query.where('is_highlight', '=', filters.is_highlight);
    }

    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);
    query.orderBy('created_at', 'DESC');

    return query;
  }

  private formatCollection(result: CollectionSchema): Collection {
    return {
      id: result.id,
      slug: result.slug,
      title: result.title,
      is_featured: result.is_featured,
      is_highlight: result.is_highlight,
      description: result.description,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  private formatFullCollection(result: CollectionFullSchema[]): FullCollection {
    const mediaMap = new Map<number, MediaPortfolio>();

    for (const row of result) {
      if (!row.m_id || mediaMap.has(row.m_id)) continue;

      mediaMap.set(row.m_id, {
        id: row.m_id,
        public_id: row.public_id,
        title: row.m_title,
        position: row.position,
        thumbnail: row.thumbnail,
        url: row.url,
        seo_filename: row.seo_filename,
        seo_alt: row.seo_alt,
        seo_description: row.seo_description,
        seo_title: row.seo_title,
        shape: row.shape,
        is_highlight: row.m_is_highlight ?? false,
      });
    }

    const first = result[0];

    return {
      id: first.id,
      slug: first.slug,
      title: first.title,
      is_featured: first.is_featured,
      is_highlight: first.is_highlight,
      description: first.description,
      user_id: first.user_id,
      created_at: first.created_at,
      updated_at: first.updated_at,
      media: Array.from(mediaMap.values()),
    };
  }
}
