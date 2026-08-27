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
import { EntitySeoFields, SeoTranslation } from '@repo/common-lib/types/ai';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import { SEO_REGENERATION_MIN_INTERVAL_DAYS } from '@repo/common-lib/constants/cache';
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
    'services.is_featured',
    'services.is_highlight',
    'services.is_indexable',
    'services.show_price',
    'services.seo_title',
    'services.seo_description',
    'services.seo_generated_at',
    'services.user_id',
    'services.portfolio_id',
    'services.blocked_at',
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
    'portfolios.is_featured as p_is_featured',
    'portfolios.is_highlight as p_is_highlight',
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

  /**
   * Titles are unique per user, never globally. Matched case-insensitively and trimmed.
   * Pass `excludeId` on update to skip the row being edited.
   */
  async titleExists(title: string, userId: number, excludeId?: number): Promise<boolean> {
    const query = this.query()
      .where('LOWER(TRIM(services.title))', '=', title.trim().toLowerCase())
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

  async getFullById(id: number): Promise<FullService | null> {
    const result = await this.query()
      .select(this.FULL_COLUMNS)
      .where('services.id', '=', id)
      .join('id', 'service_features', 'service_id', 'LEFT')
      .join('id', 'service_terms', 'service_id', 'LEFT')
      .join('portfolio_id', 'portfolios', 'id', 'LEFT')
      .get<ServiceFullSchema[]>();

    if (!result || (Array.isArray(result) && result.length === 0)) return null;
    return this.formatFullService(Array.isArray(result) ? result : [result]);
  }

  /** Services with no SEO yet, or content newer than last SEO generation. */
  async findDueForSeoGeneration(): Promise<{ id: number; user_id: number }[]> {
    const result = await Query.raw(
      `SELECT id, user_id
       FROM ${TABLES_ENUM.SERVICES}
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
   * Sitemap enumeration: publicly indexable services + owner username + the single cover
   * `thumbnail` PATH. Same visibility predicate as `findDueForSeoGeneration`. The path is signed
   * into a URL by the sitemap service.
   */
  async getSitemapServices(
    limit: number,
    offset: number,
  ): Promise<{ username: string; slug: string; updated_at: string; thumbnail: string | null }[]> {
    const result = await Query.raw(
      `SELECT s.slug, s.updated_at, s.thumbnail, u.username
       FROM ${TABLES_ENUM.SERVICES} s
       INNER JOIN ${TABLES_ENUM.USERS} u ON u.id = s.user_id
       WHERE s.blocked_at IS NULL AND s.is_active = true AND s.is_indexable = true
       ORDER BY s.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : []).map(
      (row: { username: string; slug: string; updated_at: string; thumbnail: string | null }) => ({
        username: row.username,
        slug: row.slug,
        updated_at: row.updated_at,
        thumbnail: row.thumbnail ?? null,
      }),
    );
  }

  /** Count for `getSitemapServices` (same predicate). */
  async countSitemapServices(): Promise<number> {
    const result = await Query.raw(
      `SELECT COUNT(*)::int AS count FROM ${TABLES_ENUM.SERVICES}
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
      `UPDATE ${TABLES_ENUM.SERVICES}
       SET seo_title = $1, seo_description = $2, seo_generated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [seo.seo_title ?? null, seo.seo_description ?? null, id],
    );
  }

  /** Lean SEO-only read for `generateMetadata`, localized to the request language. */
  async getSeoMetadataBySlug(
    slug: string,
    userId: number,
  ): Promise<{ seo_title: string | null; seo_description: string | null; thumbnail: string | null; is_indexable: boolean } | null> {
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
    const result = await Query.raw(
      `SELECT s.thumbnail, s.is_indexable,
              COALESCE(st.seo_title, s.seo_title) AS seo_title,
              COALESCE(st.seo_description, s.seo_description) AS seo_description
       FROM ${TABLES_ENUM.SERVICES} s
       LEFT JOIN ${TABLES_ENUM.SERVICE_TRANSLATIONS} st
         ON st.service_id = s.id AND st.language_code = $1
       WHERE s.slug = $2 AND s.user_id = $3 AND s.blocked_at IS NULL
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

  /** Upsert per-locale SEO rows into service_translations (one row per app language). */
  async upsertSeoTranslations(serviceId: number, rows: SeoTranslation[]): Promise<void> {
    for (const r of rows) {
      await Query.raw(
        `INSERT INTO ${TABLES_ENUM.SERVICE_TRANSLATIONS} (language_code, service_id, seo_title, seo_description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (language_code, service_id)
         DO UPDATE SET seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description`,
        [r.language_code, serviceId, r.seo_title ?? null, r.seo_description ?? null],
      );
    }
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
      is_featured: result.is_featured,
      is_highlight: result.is_highlight,
      is_indexable: result.is_indexable,
      show_price: result.show_price,
      seo_title: result.seo_title,
      seo_description: result.seo_description,
      seo_generated_at: result.seo_generated_at,
      user_id: result.user_id,
      portfolio_id: result.portfolio_id,
      blocked_at: result.blocked_at,
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
          is_featured: row.p_is_featured,
          is_highlight: row.p_is_highlight,
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
      is_featured: first.is_featured,
      is_highlight: first.is_highlight,
      is_indexable: first.is_indexable,
      show_price: first.show_price,
      seo_title: first.seo_title,
      seo_description: first.seo_description,
      seo_generated_at: first.seo_generated_at,
      user_id: first.user_id,
      portfolio_id: first.portfolio_id,
      blocked_at: first.blocked_at,
      portfolio,
      created_at: first.created_at,
      updated_at: first.updated_at,
      features: Array.from(featuresMap.values()),
      terms: Array.from(termsMap.values()),
    };
  }
}
