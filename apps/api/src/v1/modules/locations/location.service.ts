import { Injectable } from '@nestjs/common';
import { CountryRepository } from './country.repository';
import { StateRepository } from './state.repository';
import { CityRepository } from './city.repository';
import { LocationRepository } from './location.repository';
import { IndexCountriesRequest } from './requests/index-countries.request';
import { IndexStatesRequest } from './requests/index-states.request';
import { IndexCitiesRequest } from './requests/index-cities.request';
import type {
  City,
  CityIndexRequest,
  Country,
  CountryIndexRequest,
  CreateOrUpdateLocationPayload,
  Location,
  LocationInput,
  LocationSummary,
  State,
  StateIndexRequest,
} from '@repo/common-lib/types/location';

@Injectable()
export class LocationService {
  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly stateRepository: StateRepository,
    private readonly cityRepository: CityRepository,
    private readonly locationRepository: LocationRepository,
  ) {}

  /**
   * Resolves a picked place into its `locations` row, creating the country / state / city rows
   * it names on the way. Synchronous on purpose: the caller (a media create or update) stores the
   * returned id in the same request, so it cannot wait on the queue the address flow uses.
   */
  async resolve(input: LocationInput): Promise<Location> {
    const { country, state, city } = await this.upsertHierarchy(input);
    return this.locationRepository.upsertByPlaceId({
      place_id: input.place_id.trim(),
      formatted: input.formatted.trim(),
      name: input.name.trim(),
      result_type: input.result_type?.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      country_id: country.id,
      state_id: state?.id ?? null,
      city_id: city?.id ?? null,
    });
  }

  getSummaryById(id: number): Promise<LocationSummary | null> {
    return this.locationRepository.getSummaryById(id);
  }

  /**
   * Find-or-create the hierarchy rows a place names. Every level is optional below the country;
   * a city is kept even without a state (city-states, countries the geocoder gives no region
   * for), because a dropped city is one whose place page would silently miss its media.
   */
  async upsertHierarchy(payload: CreateOrUpdateLocationPayload): Promise<{
    country: Country;
    state?: State;
    city?: City;
  }> {
    const countryName = (payload.country ?? '').trim();
    if (!countryName) {
      throw new Error('A location needs a country');
    }
    const countryCode = (payload.country_code ?? '').trim().toLowerCase();
    const stateName = payload.state?.trim();
    const cityName = payload.city?.trim();

    const country = await this.countryRepository.upsertCountry({
      name: countryName,
      country_code: (countryCode || countryName).slice(0, 5),
    });
    const state = stateName
      ? await this.stateRepository.upsertState({ country_id: country.id, name: stateName })
      : undefined;
    const city = cityName
      ? await this.cityRepository.upsertCity({
          country_id: country.id,
          state_id: state?.id ?? null,
          name: cityName,
        })
      : undefined;

    return { country, state, city };
  }

  async getCountries(query: IndexCountriesRequest) {
    const filters: CountryIndexRequest = {
      text: query.text,
    };
    return this.countryRepository.getAll(filters);
  }

  async getStates(query: IndexStatesRequest) {
    const filters: StateIndexRequest = {
      country_id: query.country_id,
    };
    return this.stateRepository.getAll(filters);
  }

  async getCities(query: IndexCitiesRequest) {
    const filters: CityIndexRequest = {
      country_id: query.country_id,
      state_id: query.state_id,
    };
    return this.cityRepository.getAll(filters);
  }
}
