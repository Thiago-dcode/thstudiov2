import { Injectable } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import {
  LayoutConfigSchemaWithoutTimestamps,
  LayoutSchemaColumns,
} from '@repo/common-lib/schemas/layout';
import { Layout, LayoutConfig } from '@repo/common-lib/types/layout';
import { SqlValue } from '@repo/common-lib/types/database';
import { BaseRepository } from '@repo/database/repositories';
import { DbException } from '@repo/database/exceptions';
import { Query } from '@repo/database/facades';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === '23505'
  );
}

@Injectable()
export class LayoutRepository extends BaseRepository {
  private readonly LAYOUT_COLUMNS: LayoutSchemaColumns[] = [
    `${TABLES_ENUM.LAYOUTS}.id`,
    `${TABLES_ENUM.LAYOUTS}.name`,
    `${TABLES_ENUM.LAYOUTS}.is_active`,
  ] as const;

  constructor(protected readonly logService: LogService) {
    super(TABLES_ENUM.LAYOUTS, logService);
  }

  async findAllActive(): Promise<Layout[]> {
    const rows = await this.query()
      .select(this.LAYOUT_COLUMNS)
      .where('is_active', true)
      .orderBy('id', 'ASC')
      .get<Layout[]>();
    return rows ?? [];
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
   * Upserts by portfolio_id (unique).
   * Inserts first; on unique violation, falls back to update.
   */
  async upsertConfigForPortfolio(
    portfolioId: number,
    layoutId: number,
    config: LayoutConfig,
  ): Promise<LayoutConfigSchemaWithoutTimestamps> {
    const configValue = (
      config === null ? null : JSON.stringify(config)
    ) as SqlValue;

    try {
      await Query.table(TABLES_ENUM.LAYOUT_CONFIG).insert(
        ['layout_id', 'portfolio_id', 'config'],
        [layoutId, portfolioId, configValue],
      );
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      await Query.table(TABLES_ENUM.LAYOUT_CONFIG)
        .where('portfolio_id', portfolioId)
        .update(['layout_id', 'config'], [layoutId, configValue]);
    }

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
