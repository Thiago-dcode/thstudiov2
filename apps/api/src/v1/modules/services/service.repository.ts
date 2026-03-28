import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { Query } from '@repo/database/facades';
import {
  ServiceFullSchema,
  ServiceFullSchemaColumns,
  ServiceSchema,
  ServiceSchemaColumns,
  ServiceFeatureSchema,
  ServiceTermSchema,
} from '@repo/common-lib/schemas/service';
import {
  CreateServiceInput,
  UpdateServiceInput,
  FullService,
  Service,
  ServiceIndexRequest,
} from '@repo/common-lib/types/service';
import { DbException } from '@repo/database/exceptions';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class ServiceRepository extends BaseRepository {
  private readonly COLUMNS: ServiceSchemaColumns[] = [
    'services.id',
    'services.title',
    'services.slug',
    'services.description',
    'services.thumbnail',
    'services.price',
    'services.is_active',
    'services.highlight',
    'services.show_price',
    'services.user_id',
    'services.portfolio_id',
    'services.created_at',
    'services.updated_at',
  ] as const;

  private readonly FULL_COLUMNS: ServiceFullSchemaColumns[] = [
    ...this.COLUMNS,
    'service_features.id as sf_id',
    'service_features.title as sf_title',
    'service_terms.id as st_id',
    'service_terms.title as st_title',
    'portfolios.id as p_id',
    'portfolios.title as p_title',
    'portfolios.slug as p_slug',
    'portfolios.user_highlight as p_user_highlight',
    'portfolios.highlight as p_highlight',
  ];

  constructor(private readonly requestService: RequestService) {
    super('services');
  }

  async getAll(filters: ServiceIndexRequest): Promise<Service[]> {
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<ServiceSchema[]>();
    return results.map((result) => this.formatService(result));
  }

  async slugExists(slug: string, userId: number): Promise<boolean> {
    const result = await this.query()
      .where('slug', '=', slug)
      .where('user_id', '=', userId)
      .exists();

    return !!result;
  }

  async getBySlug(slug: string, userId: number): Promise<FullService> {
    const result = await this.query()
      .select(this.FULL_COLUMNS)
      .where('slug', '=', slug)
      .where('user_id', '=', userId)
      .join('id', 'service_features', 'service_id', 'LEFT')
      .join('id', 'service_terms', 'service_id', 'LEFT')
      .join('portfolio_id', 'portfolios', 'id', 'LEFT')
      .get<ServiceFullSchema[]>();

    if (!result || (Array.isArray(result) && result.length === 0)) return null;
    return this.formatFullService(Array.isArray(result) ? result : [result]);
  }

  async getOneCompact(id: number) {
    const result = await this.query().select(this.COLUMNS).where('id', '=', id).first();
    return result ? this.formatService(result) : null;
  }

  async create({ features, terms, ...serviceData }: CreateServiceInput): Promise<Service> {
    const cols = Object.keys(serviceData);
    const values = Object.values(serviceData);

    const serviceResult = await this.query().insertAndGet<ServiceSchema>(cols, values);
    if (!serviceResult) {
      throw new DbException('Could not create service');
    }

    await this.syncRelations(serviceResult.id, { features, terms });

    return serviceResult;
  }

  async updateById(id: number, { features, terms, ...serviceData }: UpdateServiceInput): Promise<Service> {
    const cols = Object.keys(serviceData);
    const values = Object.values(serviceData) as string[];

    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }

    await this.syncRelations(id, { features, terms });

    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<ServiceSchema>();

    if (!result) {
      throw new DbException('Could not update service');
    }

    return this.formatService(result);
  }

  async delete(id: number) {
    return await this.query().where('id', '=', id).delete();
  }

  private async syncRelations(serviceId: number, { features, terms }: {
    features?: { title: string }[];
    terms?: { title: string }[];
  }) {
    const promises: Promise<unknown>[] = [];

    if (features) {
      promises.push(this.syncChildren('service_features', serviceId, features));
    }

    if (terms) {
      promises.push(this.syncChildren('service_terms', serviceId, terms));
    }

    await Promise.all(promises);
  }

  private async syncChildren(
    table: 'service_features' | 'service_terms',
    serviceId: number,
    items: { title: string }[],
  ) {
    await Query.table(table).where('service_id', '=', serviceId).__forceDelete();

    if (items.length === 0) return;

    await Promise.all(
      items.map((item) =>
        Query.table(table).insertAndGet(['title', 'service_id'], [item.title, serviceId]),
      ),
    );
  }

  protected async applyFilters(
    filters: ServiceIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.select(this.COLUMNS);

    if (filters.user_id) {
      query.where('user_id', '=', filters.user_id);
    }

    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);
    query.orderBy('created_at', 'DESC');

    return query;
  }

  private formatService(result: ServiceSchema): Service {
    return {
      id: result.id,
      title: result.title,
      slug: result.slug,
      description: result.description,
      thumbnail: result.thumbnail,
      price: result.price,
      is_active: result.is_active,
      highlight: result.highlight,
      show_price: result.show_price,
      user_id: result.user_id,
      portfolio_id: result.portfolio_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  private formatFullService(result: ServiceFullSchema[]): FullService {
    const featuresMap = new Map<number, Pick<ServiceFeatureSchema, 'id' | 'title'>>();
    const termsMap = new Map<number, Pick<ServiceTermSchema, 'id' | 'title'>>();

    let portfolio: FullService['portfolio'] = undefined;

    for (const row of result) {
      if (row.sf_id && !featuresMap.has(row.sf_id)) {
        featuresMap.set(row.sf_id, {
          id: row.sf_id,
          title: row.sf_title,
        });
      }

      if (row.st_id && !termsMap.has(row.st_id)) {
        termsMap.set(row.st_id, {
          id: row.st_id,
          title: row.st_title,
        });
      }

      if (!portfolio && row.p_id) {
        portfolio = {
          id: row.p_id,
          slug: row.p_slug,
          title: row.p_title,
          user_highlight: row.p_user_highlight,
          highlight: row.p_highlight,
        }
      }
    }

    const first = result[0];

    return {
      id: first.id,
      title: first.title,
      slug: first.slug,
      description: first.description,
      thumbnail: first.thumbnail,
      price: first.price,
      is_active: first.is_active,
      highlight: first.highlight,
      show_price: first.show_price,
      user_id: first.user_id,
      portfolio_id: first.portfolio_id,
      portfolio,
      created_at: first.created_at,
      updated_at: first.updated_at,
      features: Array.from(featuresMap.values()),
      terms: Array.from(termsMap.values()),
    };
  }
}
