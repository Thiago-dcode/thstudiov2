import { Injectable } from '@nestjs/common';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { LocationSchemaColumns } from '@repo/common-lib/schemas/location';
import type {
  CreateLocationInput,
  Location,
  LocationSummary,
} from '@repo/common-lib/types/location';
import { BaseRepository } from '@repo/database/repositories';
import { upsertReturning } from './upsert-returning';

/** Picked places — one row per geocoder feature, keyed by its `place_id`. */
@Injectable()
export class LocationRepository extends BaseRepository {
  private readonly COLUMNS: LocationSchemaColumns[] = [
    'locations.id',
    'locations.place_id',
    'locations.formatted',
    'locations.name',
    'locations.result_type',
    'locations.latitude',
    'locations.longitude',
    'locations.country_id',
    'locations.state_id',
    'locations.city_id',
    'locations.created_at',
    'locations.updated_at',
  ] as const;

  constructor() {
    super(TABLES_ENUM.LOCATIONS);
  }

  /**
   * Find-or-create by `place_id`. A later pick only finds the existing row, it never rewrites
   * it: the place is shared by every artist's media, and the pick's fields come straight from
   * the client, so refreshing them let any artist rename or re-parent another artist's place.
   * The cost is that a geocoder-side rename does not propagate on its own.
   */
  async upsertByPlaceId(input: CreateLocationInput): Promise<Location> {
    return upsertReturning<Location>({
      table: TABLES_ENUM.LOCATIONS,
      row: input,
      conflict: ['place_id'],
      update: [],
      returning: this.COLUMNS,
    });
  }

  /** The place with its hierarchy names, for contexts that describe it in words (the AI prompt). */
  async getSummaryById(id: number): Promise<LocationSummary | null> {
    const row = await this.query()
      .select([
        'locations.id',
        'locations.formatted',
        'locations.name',
        'cities.name as city',
        'states.name as state',
        'countries.name as country',
      ])
      .where('locations.id', '=', id)
      .join('city_id', TABLES_ENUM.CITIES, 'id', 'LEFT')
      .join('state_id', TABLES_ENUM.STATES, 'id', 'LEFT')
      .join('country_id', TABLES_ENUM.COUNTRIES, 'id', 'LEFT')
      .first<LocationSummary>();
    return row ?? null;
  }
}
