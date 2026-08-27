import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import {
  LlmTokensUsageSchema,
  LlmTokensUsageSchemaColumns,
} from '@repo/common-lib/schemas/llm-tokens-usage';
import {
  CreateLlmTokensUsageInput,
  UpdateLlmTokensUsageInput,
  LlmTokensUsage,
  LlmTokensUsageIndexRequest,
} from '@repo/common-lib/types/llm-tokens-usage';

@Injectable()
export class LlmTokensUsageRepository extends BaseRepository {
  private readonly COLUMNS: LlmTokensUsageSchemaColumns[] = [
    'llm_tokens_usage.id',
    'llm_tokens_usage.tokens',
    'llm_tokens_usage.model',
    'llm_tokens_usage.user_id',
    'llm_tokens_usage.usage_type',
    'llm_tokens_usage.matches_expected_response',
    'llm_tokens_usage.created_at',
    'llm_tokens_usage.updated_at',
  ] as const;

  constructor() {
    super('llm_tokens_usage');
  }

  async findById(id: number): Promise<LlmTokensUsage> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<LlmTokensUsageSchema>();
    if (!result) {
      throw new HttpException(
        'LlmTokensUsage not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatLlmTokensUsage(result);
  }

  async findByUserId(userId: number,): Promise<LlmTokensUsage[]> {
    const results = await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .get<LlmTokensUsageSchema[]>();
    return results.map((result) => this.formatLlmTokensUsage(result));
  }

  async findOneByColumn(
    column: keyof LlmTokensUsageSchema,
    value: any,
  ): Promise<LlmTokensUsage | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where(column, '=', value)
      .first<LlmTokensUsageSchema>();
    if (!result) return null;
    return this.formatLlmTokensUsage(result);
  }

  async create(data: CreateLlmTokensUsageInput): Promise<LlmTokensUsage> {
    const result = await super._create<LlmTokensUsageSchema>(data, {
      select: this.COLUMNS,
    });
    return this.formatLlmTokensUsage(result);
  }

  async updateById(
    id: number,
    data: UpdateLlmTokensUsageInput,
  ): Promise<LlmTokensUsage> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    await this.query().where('id', '=', id).update(columns, values);
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<LlmTokensUsageSchema>();
    return this.formatLlmTokensUsage(result);
  }

  async deleteById(id: number): Promise<void> {
    await this.query().where('id', '=', id).delete();
  }

  async findAll(filters: LlmTokensUsageIndexRequest): Promise<LlmTokensUsage[]> {
    const query = await this.applyFilters(filters, this.query());
    const results = await query.get<LlmTokensUsageSchema[]>();
    return results.map((result) => this.formatLlmTokensUsage(result));
  }

  async applyFilters(
    filters: LlmTokensUsageIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.select(this.COLUMNS);

    if (filters.user_id) {
      query.where('user_id', '=', filters.user_id);
    }

    if (filters.created_at_from) {
      query.where('created_at', '>=', filters.created_at_from);
    }

    if (filters.created_at_to) {
      query.where('created_at', '<=', filters.created_at_to);
    }

    query.orderBy('created_at', 'DESC');
    return query;
  }

  private formatLlmTokensUsage(
    result: LlmTokensUsageSchema,
  ): LlmTokensUsage {
    return {
      id: result.id,
      tokens: result.tokens,
      model: result.model,
      user_id: result.user_id,
      usage_type: result.usage_type,
      matches_expected_response: result.matches_expected_response,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }
}

