import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { CitySchemaColumns } from '@repo/common-lib/schemas/location';
import {
  City,
  CityIndexRequest,
  CreateCityInput,
  UpdateCityInput,
} from '@repo/common-lib/types/location';
import { DbException } from '@repo/database/exceptions';
import type { SqlValue } from '@repo/common-lib/types/database';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { toPlaceSlug } from '@repo/common-lib/utils/place-slug';
import { upsertReturning } from './upsert-returning';

@Injectable()
export class CityRepository extends BaseRepository {
  private readonly COLUMNS: CitySchemaColumns[] = [
    'cities.id',
    'cities.name',
    'cities.slug',
    'cities.state_id',
    'cities.country_id',
    'cities.created_at',
    'cities.updated_at',
  ] as const;

  constructor() {
    super(TABLES_ENUM.CITIES);
  }

  async getAll(filters: CityIndexRequest): Promise<City[]> {
    const query = await this.applyFilters(filters, this.query());
    return query.get<City[]>();
  }

  async getById(id: number): Promise<City | null> {
    return this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<City>();
  }

  /**
   * Find-or-create by slug within (country, state). `state_id` may be null — the unique index is
   * NULLS NOT DISTINCT, so a stateless city still resolves to a single row.
   */
  async upsertCity(input: {
    country_id: number;
    state_id: number | null;
    name: string;
  }): Promise<City> {
    return upsertReturning<City>({
      table: TABLES_ENUM.CITIES,
      row: {
        country_id: input.country_id,
        state_id: input.state_id,
        name: input.name,
        slug: toPlaceSlug(input.name),
      },
      conflict: ['country_id', 'state_id', 'slug'],
      returning: this.COLUMNS,
    });
  }

  async create(data: CreateCityInput): Promise<City> {
    const cols = Object.keys(data);
    const values = Object.values(data) as SqlValue[];
    const result = await this.query().insertAndGet<City>(cols, values, this.COLUMNS);
    if (!result) {
      throw new DbException('Could not create city');
    }
    return result;
  }

  async updateById(id: number, data: UpdateCityInput): Promise<City> {
    const cols = Object.keys(data);
    const values = Object.values(data) as SqlValue[];
    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<City>();
    if (!result) {
      throw new DbException('Could not update city');
    }
    return result;
  }

  async delete(id: number) {
    return await this.query().where('id', '=', id).delete();
  }

  protected async applyFilters(
    filters: CityIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.select(this.COLUMNS);

    if (filters.country_id !== undefined) {
      query.where('country_id', '=', filters.country_id);
    }
    if (filters.state_id !== undefined) {
      query.where('state_id', '=', filters.state_id);
    }

    query.orderBy('name', 'ASC');

    return query;
  }
}
