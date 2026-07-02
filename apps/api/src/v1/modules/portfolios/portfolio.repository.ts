import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
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
import { CompactUser } from '@repo/common-lib/types/user';
import { DbException } from '@repo/database/exceptions';
import { RequestService } from 'src/common/services/request.service';
import { MediaPortfolio } from '@repo/common-lib/types/media';
import { CategoryBase } from '@repo/common-lib/types/category';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';

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
    'media.seo_description',
    'media.seo_title',
    'media.is_featured as m_is_featured',
    'media.is_highlight as m_is_highlight',
    'media.is_active as m_is_active',
    'categories.id as c_id',
    'categories.slug as c_slug',
  ];

  constructor(private readonly requestService: RequestService, protected readonly logService: LogService) {
    super('portfolios', logService);
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
    const lang = this.requestService.language;
    return query
      .rawSelect(
        [
          ...this.FULL_COLUMNS,
          `COALESCE(category_translations.name, categories.name) as c_name`,
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

  async countHighlights(userId: number): Promise<number> {
    return this.query()
      .where('user_id', '=', userId)
      .where('is_highlight', '=', true)
      .count();
  }

  async findCategoriesForPortfolio(portfolioId: number): Promise<CategoryBase[]> {
    const lang = this.requestService.language;
    const rows = await this.query()
      .rawSelect(
        `categories.id,
         categories.tags,
         categories.thumbnail,
         categories.is_featured,
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
    }));
  }

  async create({ media, collections, categories, ...portfolioData }: CreatePortfolioInput): Promise<Portfolio> {
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

  async updateById(id: number, { media, collections, categories, ...portfolioData }: UpdatePortfolioInput): Promise<Portfolio> {
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
          seo_description: row.seo_description,
          seo_title: row.seo_title,
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
          is_featured: false,
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
      blocked_at: first.blocked_at,
      user_id: first.user_id,
      created_at: first.created_at,
      updated_at: first.updated_at,
      artist: this.formatArtist(first),
      media: Array.from(mediaMap.values()),
      collections: [],
      categories: Array.from(categoriesMap.values()),
    };
  }
}
