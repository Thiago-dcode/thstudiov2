import { fetchApi } from '@/lib/facade/fetchApi';
import { BaseService } from '@/lib/services/base.service';
import type {
  City,
  CityIndexRequest,
  Country,
  CountryIndexRequest,
  State,
  StateIndexRequest,
} from '@repo/common-lib/types/location';
import { ApiResponse } from '@repo/common-lib/types/response';
import { queryParamBuilder } from '@repo/common-lib/utils/query-builder';

class LocationService extends BaseService {
  constructor() {
    super(fetchApi(), 'location');
  }

  async getCountries(
    request?: CountryIndexRequest,
  ): Promise<ApiResponse<Country[]>> {
    return await this.fetchApi.get({
      resource: request
        ? queryParamBuilder('countries', request)
        : 'countries',
    });
  }

  async getStates(
    request?: StateIndexRequest,
  ): Promise<ApiResponse<State[]>> {
    return await this.fetchApi.get({
      resource: request
        ? queryParamBuilder('states', request)
        : 'states',
    });
  }

  async getCities(request?: CityIndexRequest): Promise<ApiResponse<City[]>> {
    return await this.fetchApi.get({
      resource: request
        ? queryParamBuilder('cities', request)
        : 'cities',
    });
  }
}

export default new LocationService();
