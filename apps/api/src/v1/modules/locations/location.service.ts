import { Injectable } from '@nestjs/common';
import { CountryRepository } from './country.repository';
import { StateRepository } from './state.repository';
import { CityRepository } from './city.repository';
import { IndexCountriesRequest } from './requests/index-countries.request';
import { IndexStatesRequest } from './requests/index-states.request';
import { IndexCitiesRequest } from './requests/index-cities.request';
import type {
  CityIndexRequest,
  CountryIndexRequest,
  StateIndexRequest,
} from '@repo/common-lib/types/location';

@Injectable()
export class LocationService {
  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly stateRepository: StateRepository,
    private readonly cityRepository: CityRepository,
  ) {}

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
