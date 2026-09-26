import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { CountrySchemaColumns } from '@repo/common-lib/schemas/location';
import {
    Country,
    CountryIndexRequest,
    CreateCountryInput,
    UpdateCountryInput,
} from '@repo/common-lib/types/location';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DbException } from '@repo/database/exceptions';
import type { SqlValue } from '@repo/common-lib/types/database';
import { toPlaceSlug } from '@repo/common-lib/utils/place-slug';
import { upsertReturning } from './upsert-returning';

@Injectable()
export class CountryRepository extends BaseRepository {
    private readonly COLUMNS: CountrySchemaColumns[] = [
        'countries.id',
        'countries.country_code',
        'countries.name',
        'countries.slug',
        'countries.created_at',
        'countries.updated_at',
    ] as const;

    constructor() {
        super(TABLES_ENUM.COUNTRIES);
    }

    async getAll(filters: CountryIndexRequest): Promise<Country[]> {
        const query = await this.applyFilters(filters, this.query());
        return query.get<Country[]>();
    }

    async getById(id: number): Promise<Country | null> {
        return this.query()
            .select(this.COLUMNS)
            .where('id', '=', id)
            .first<Country>();
    }

    /**
     * Find-or-create by ISO code — the one key that does not depend on the geocoder's spelling.
     * The first writer's name and slug stand: renaming on conflict could collide with another
     * country's slug and would move the country's public URL under existing links.
     */
    async upsertCountry(input: {
        name: string;
        country_code: string;
    }): Promise<Country> {
        return upsertReturning<Country>({
            table: TABLES_ENUM.COUNTRIES,
            row: {
                name: input.name,
                country_code: input.country_code,
                slug: toPlaceSlug(input.name),
            },
            conflict: ['country_code'],
            returning: this.COLUMNS,
        });
    }

    async create(data: CreateCountryInput): Promise<Country> {
        const cols = Object.keys(data);
        const values = Object.values(data) as SqlValue[];
        const result = await this.query().insertAndGet<Country>(cols, values, this.COLUMNS);
        if (!result) {
            throw new DbException('Could not create country');
        }
        return result;
    }

    async updateById(id: number, data: UpdateCountryInput): Promise<Country> {
        const cols = Object.keys(data);
        const values = Object.values(data) as SqlValue[];
        if (cols.length && values.length) {
            await this.query().where('id', '=', id).update(cols, values);
        }
        const result = await this.query()
            .select(this.COLUMNS)
            .where('id', '=', id)
            .first<Country>();
        if (!result) {
            throw new DbException('Could not update country');
        }
        return result;
    }

    async delete(id: number) {
        return await this.query().where('id', '=', id).delete();
    }

    protected async applyFilters(
        filters: CountryIndexRequest,
        query: QueryBuilder,
    ): Promise<QueryBuilder> {
        query.select(this.COLUMNS);

        if (filters.text) {
            const t = filters.text.trim();
            query.whereGroup([
                ['countries.name', 'ILIKE', `%${t}%`, 'where'],
                ['countries.country_code', 'ILIKE', `%${t}%`, 'orWhere'],
            ]);
        }

        query.orderBy('name', 'ASC');

        return query;
    }
}
