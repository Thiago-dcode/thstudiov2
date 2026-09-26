import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { StateSchemaColumns } from '@repo/common-lib/schemas/location';
import {
  CreateStateInput,
  State,
  StateIndexRequest,
  UpdateStateInput,
} from '@repo/common-lib/types/location';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DbException } from '@repo/database/exceptions';
import type { SqlValue } from '@repo/common-lib/types/database';
import { toPlaceSlug } from '@repo/common-lib/utils/place-slug';
import { upsertReturning } from './upsert-returning';

@Injectable()
export class StateRepository extends BaseRepository {
  private readonly COLUMNS: StateSchemaColumns[] = [
    'states.id',
    'states.name',
    'states.slug',
    'states.country_id',
    'states.created_at',
    'states.updated_at',
  ] as const;

  constructor() {
    super(TABLES_ENUM.STATES);
  }

  async getAll(filters: StateIndexRequest): Promise<State[]> {
    const query = await this.applyFilters(filters, this.query());
    return query.get<State[]>();
  }

  async getById(id: number): Promise<State | null> {
    return this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<State>();
  }

  /** Find-or-create by slug within the country, so spellings that differ only in accents/case share a row. */
  async upsertState(input: { country_id: number; name: string }): Promise<State> {
    return upsertReturning<State>({
      table: TABLES_ENUM.STATES,
      row: {
        country_id: input.country_id,
        name: input.name,
        slug: toPlaceSlug(input.name),
      },
      conflict: ['country_id', 'slug'],
      returning: this.COLUMNS,
    });
  }

  async create(data: CreateStateInput): Promise<State> {
    const cols = Object.keys(data);
    const values = Object.values(data) as SqlValue[];
    const result = await this.query().insertAndGet<State>(cols, values, this.COLUMNS);
    if (!result) {
      throw new DbException('Could not create state');
    }
    return result;
  }

  async updateById(id: number, data: UpdateStateInput): Promise<State> {
    const cols = Object.keys(data);
    const values = Object.values(data) as SqlValue[];
    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<State>();
    if (!result) {
      throw new DbException('Could not update state');
    }
    return result;
  }

  async delete(id: number) {
    return await this.query().where('id', '=', id).delete();
  }

  protected async applyFilters(
    filters: StateIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.select(this.COLUMNS);

    if (filters.country_id !== undefined) {
      query.where('country_id', '=', filters.country_id);
    }

    query.orderBy('name', 'ASC');

    return query;
  }
}
