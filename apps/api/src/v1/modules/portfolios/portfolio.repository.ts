import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import {
  PortfolioSchema,
  PortfolioSchemaColumns,
} from '@repo/common-lib/schemas/portfolio';
import {
  CreatePortfolioInput,
  Portfolio,
  PortfolioIndexRequest,
} from '@repo/common-lib/types/portfolio';
import { DbException } from '@repo/database/exceptions';
import { RequestService } from 'src/common/services/request.service';

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

  constructor(private readonly requestService: RequestService) {
    super('portfolios');
  }

  async getAll(filters: PortfolioIndexRequest): Promise<Portfolio[]> {
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<PortfolioSchema[]>();
    return results.map((result) => this.formatPortfolio(result));
  }

  async getBySlug(slug: string, userId: number): Promise<Portfolio | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('slug', '=', slug)
      .where('user_id', '=', userId)
      .first<PortfolioSchema>();
    
    if (!result) return null;
    return this.formatPortfolio(result);
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

    console.log(cols,values);
    // First create the portfolio base data
    const portfolioResult = await this.query().insertAndGet<PortfolioSchema>(cols, values);
    console.log("PORTFOLIO",portfolioResult)
    if (!portfolioResult) {
      throw new DbException('Could not create portfolio');
    }

    // Attach media and collection relations in parallel
    const attachPromises: Promise<unknown>[] = [];

    if (media) {
      attachPromises.push(
        this.attach('portfolio_media', {
          modelCol: 'portfolio_id',
          modelValue: portfolioResult.id,
          attachCol: 'media_id',
          valuesToAttach: media.map(m => ({
            value: m.id,
            columns: {
              'position': m.position,
            },
          }))
        })
      );
    }

    if (collections) {
      attachPromises.push(
        this.attach('portfolio_collection', {
          modelCol: 'portfolio_id',
          modelValue: portfolioResult.id,
          attachCol: 'collection_id',
          valuesToAttach: collections.map(c => ({
            value: c.id,
            columns: {
              'position': c.position,
            },
          }))
        })
      );
    }

    await Promise.all(attachPromises);

    return portfolioResult;
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
}
