import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import {
  PortfolioFullSchema,
  PortfolioFullSchemaColumns,
  PortfolioSchema,
  PortfolioSchemaColumns,
} from '@repo/common-lib/schemas/portfolio';
import {
  CreatePortfolioInput,
  UpdatePortfolioInput,
  FullPortfolio,
  Portfolio,
  PortfolioIndexRequest,
} from '@repo/common-lib/types/portfolio';
import { DbException } from '@repo/database/exceptions';
import { RequestService } from 'src/common/services/request.service';
import { MediaPortfolio } from '@repo/common-lib/types/media';

@Injectable()
export class PortfolioRepository extends BaseRepository {
  private readonly COLUMNS: PortfolioSchemaColumns[] = [
    'portfolios.id',
    'portfolios.slug',
    'portfolios.title',
    'portfolios.thumbnail',
    'portfolios.description',
    'portfolios.user_id',
    'portfolios.created_at',
    'portfolios.updated_at',
  ] as const;

  private readonly FULL_COLUMNS: PortfolioFullSchemaColumns[] = [
    ...this.COLUMNS,
    'portfolio_media.media_id',
    'portfolio_media.position',
    'media.id as m_id',
    'media.public_id',
    'media.thumbnail as m_thumbnail',
    'media.shape',
    'media.title as m_title',
    'media.seo_alt',
    'media.seo_filename',
    'media.seo_description',
    'media.seo_title'
  ];

  constructor(private readonly requestService: RequestService) {
    super('portfolios');
  }

  async getAll(filters: PortfolioIndexRequest): Promise<Portfolio[]> {
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<PortfolioSchema[]>();
    return results.map((result) => this.formatPortfolio(result));
  }

  async getBySlug(slug: string, userId: number): Promise<FullPortfolio> {
    const result = await this.query()
      .select(this.FULL_COLUMNS)
      .where('slug', '=', slug)
      .where('user_id', '=', userId)
      .join('id', 'portfolio_media', 'portfolio_id', 'LEFT')
      .join('portfolio_media.media_id', 'media', 'id', 'LEFT')
      .join('id', 'portfolio_collection', 'portfolio_id', 'LEFT')
      .join('portfolio_collection.collection_id', 'collections', 'id', 'LEFT')
      .get<PortfolioFullSchema[]>();

    if (!result || (Array.isArray(result) && result.length === 0)) return null;
    return this.formatFullPortfolio(Array.isArray(result) ? result : [result]);
  }

  async getOneCompact(id: number) {

    const result = await this.query().select(this.COLUMNS).where('id', '=', id).first();

    return result ? this.formatPortfolio(result) : null;
  }

  async slugExists(slug: string, userId: number): Promise<boolean> {
    const result = await this.query()
      .where('slug', '=', slug)
      .where('user_id', '=', userId)
      .exists();

    return !!result;
  }




  async create({ media, collections, ...portfolioData }: CreatePortfolioInput): Promise<Portfolio> {
    const cols = Object.keys(portfolioData);
    const values = Object.values(portfolioData);

    // First create the portfolio base data
    const portfolioResult = await this.query().insertAndGet<PortfolioSchema>(cols, values);
    if (!portfolioResult) {
      throw new DbException('Could not create portfolio');
    }


    await this.attachRelations(portfolioResult.id, {
      media, collections
    })

    return portfolioResult;
  }

  async updateById(id: number, { media, collections, ...portfolioData }: UpdatePortfolioInput): Promise<Portfolio> {
    const cols = Object.keys(portfolioData);
    const values = Object.values(portfolioData) as string[];

    // Update portfolio base data if any scalar fields changed
    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }

    // Re-attach media and collection relations in parallel
    await this.attachRelations(id, {
      media, collections
    });

    // Return the updated portfolio
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<PortfolioSchema>();

    if (!result) {
      throw new DbException('Could not update portfolio');
    }

    return this.formatPortfolio(result);
  }

  private async attachRelations(portfolioId: number, { media, collections }: {
    media: {
      id: number;
      position: number;
    }[], collections: {
      id: number;
      position: number;
    }[]
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

    await Promise.all(attachPromises);
  }
  async delete(id: number) {

    return await this.query().where('id', '=', id).delete()

  }

  protected async applyFilters(
    filters: PortfolioIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.select(this.COLUMNS);

    if (filters.user_id) {
      query.where('user_id', '=', filters.user_id);
    }

    this.requestService.pagination =
      await BaseRepository.handleOffsetPagination(query, filters);
    query.orderBy('created_at', 'DESC');

    return query;
  }

  private formatPortfolio(result: PortfolioSchema): Portfolio {
    return {
      id: result.id,
      slug: result.slug,
      title: result.title,
      thumbnail: result.thumbnail,
      description: result.description,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }
  private formatFullPortfolio(result: PortfolioFullSchema[]): FullPortfolio {
    const mediaMap = new Map<number, MediaPortfolio>();

    for (const row of result) {
      if (!row.m_id || mediaMap.has(row.m_id)) continue;

      mediaMap.set(row.m_id, {
        id: row.m_id,
        public_id: row.public_id,
        title: row.m_title,
        position: row.position,
        thumbnail: row.m_thumbnail,
        seo_filename: row.seo_filename,
        seo_alt: row.seo_alt,
        seo_description: row.seo_description,
        seo_title: row.seo_title,
        shape: row.shape,
      });
    }

    const first = result[0];

    return {
      id: first.id,
      slug: first.slug,
      title: first.title,
      thumbnail: first.thumbnail,
      description: first.description,
      user_id: first.user_id,
      created_at: first.created_at,
      updated_at: first.updated_at,
      media: Array.from(mediaMap.values()),
      collections: [], // TODO: implement collection relationship
    };
  }
}
