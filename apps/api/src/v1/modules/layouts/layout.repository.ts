import { Injectable } from '@nestjs/common';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import {
  LayoutConfigSchemaWithoutTimestamps,
  LayoutSchemaColumns,
} from '@repo/common-lib/schemas/layout';
import {
  Layout,
  LayoutConfig,
  LayoutIndexRequest,
} from '@repo/common-lib/types/layout';
import { BaseRepository } from '@repo/database/repositories';
import { DbException } from '@repo/database/exceptions';
import { Query } from '@repo/database/facades';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class LayoutRepository extends BaseRepository {
  private readonly LAYOUT_COLUMNS: LayoutSchemaColumns[] = [
    `${TABLES_ENUM.LAYOUTS}.id`,
    `${TABLES_ENUM.LAYOUTS}.name`,
    `${TABLES_ENUM.LAYOUTS}.is_active`,
  ] as const;

  constructor(
    private readonly requestService: RequestService
  ) {
    super(TABLES_ENUM.LAYOUTS);
  }

  async findAll(filters: LayoutIndexRequest): Promise<Layout[]> {
    const query = await this.applyFilters(filters, this.query().select(this.LAYOUT_COLUMNS));
    const rows = await query.get<Layout[]>();
    return rows ?? [];
  }

  protected async applyFilters(
    filters: LayoutIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    if (typeof filters.is_active === 'boolean') {
      query.where('is_active', '=', filters.is_active);
    }

    this.requestService.pagination = await this.handleOffsetPagination(
      query,
      filters,
    );
    query.orderBy('id', 'ASC');
    return query;
  }

  async findById(id: number): Promise<Layout | null> {
    return await this.query()
      .select(this.LAYOUT_COLUMNS)
      .where('id', id)
      .first<Layout>();
  }

  async findByName(name: EnumType<'LAYOUT_TYPE'>): Promise<Layout | null> {
    return await this.query()
      .select(this.LAYOUT_COLUMNS)
      .where('name', name)
      .first<Layout>();
  }

  async findConfigByPortfolioId(
    portfolioId: number,
  ): Promise<LayoutConfigSchemaWithoutTimestamps | null> {
    const row = await Query.table(TABLES_ENUM.LAYOUT_CONFIG)
      .select(['id', 'layout_id', 'portfolio_id', 'config'])
      .where('portfolio_id', portfolioId)
      .first<LayoutConfigSchemaWithoutTimestamps>();
    return row ? this.normalizeConfigRow(row) : null;
  }

  /**
   * Upserts by portfolio_id (unique via `UC_layout_config_portfolio`), so a portfolio always has
   * exactly one config row — updating one just rewrites it.
   *
   * Done in a single `ON CONFLICT` statement rather than insert-then-catch-then-update: the
   * conflict is the normal case on update, not an exception, and recovering from it required
   * recognising the driver error. That recognition silently broke once the client started
   * wrapping SQLSTATE 23505 in `DbUniqueViolationException` (the raw `code` no longer survives),
   * which made every portfolio update fail. Letting Postgres resolve the conflict removes the
   * dependency on how DB errors are typed, and closes the write-write window between the failed
   * insert and the follow-up update.
   *
   * `config` is jsonb and bound as an untyped text parameter, hence the explicit `::jsonb` cast.
   */
  async upsertConfigForPortfolio(
    portfolioId: number,
    layoutId: number,
    config: LayoutConfig,
  ): Promise<LayoutConfigSchemaWithoutTimestamps> {
    const configValue = config === null ? null : JSON.stringify(config);

    await Query.raw(
      `INSERT INTO ${TABLES_ENUM.LAYOUT_CONFIG} (layout_id, portfolio_id, config)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (portfolio_id)
       DO UPDATE SET layout_id = EXCLUDED.layout_id, config = EXCLUDED.config`,
      [layoutId, portfolioId, configValue],
    );

    const result = await this.findConfigByPortfolioId(portfolioId);
    if (!result) {
      throw new DbException('Could not upsert layout config');
    }
    return result;
  }

  private normalizeConfigRow(
    row: LayoutConfigSchemaWithoutTimestamps,
  ): LayoutConfigSchemaWithoutTimestamps {
    return {
      ...row,
      config:
        typeof row.config === 'string'
          ? (JSON.parse(row.config) as Record<string, unknown>)
          : row.config,
    };
  }
}
