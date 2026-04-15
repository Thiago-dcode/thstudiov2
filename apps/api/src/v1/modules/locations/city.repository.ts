import { LogService } from '@repo/backend-lib/services/log-service';
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

@Injectable()
export class CityRepository extends BaseRepository {
  private readonly COLUMNS: CitySchemaColumns[] = [
    'cities.id',
    'cities.name',
    'cities.state_id',
    'cities.country_id',
    'cities.created_at',
    'cities.updated_at',
  ] as const;

  constructor(protected readonly logService: LogService) {
    super(TABLES_ENUM.CITIES, logService);
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

  async findByStateCountryAndName(
    stateId: number,
    countryId: number,
    name: string,
  ): Promise<City | null> {
    return this.query()
      .select(this.COLUMNS)
      .where('state_id', '=', stateId)
      .where('country_id', '=', countryId)
      .where('name', '=', name)
      .first<City>();
  }

  async upsertCity(input: {
    country_id: number;
    state_id: number;
    name: string;
  }): Promise<City> {
    const existing = await this.findByStateCountryAndName(
      input.state_id,
      input.country_id,
      input.name,
    );
    if (existing) {
      return await this.updateById(existing.id, { name: input.name });
    }
    return await this.create({
      country_id: input.country_id,
      state_id: input.state_id,
      name: input.name,
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
