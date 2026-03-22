import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { LocationService } from './location.service';
import { IndexCountriesRequest } from './requests/index-countries.request';
import { IndexStatesRequest } from './requests/index-states.request';
import { IndexCitiesRequest } from './requests/index-cities.request';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('countries')
  @Public()
  async countries(@Query() query: IndexCountriesRequest) {
    return await this.locationService.getCountries(query);
  }

  @Get('states')
  @Public()
  async states(@Query() query: IndexStatesRequest) {
    return await this.locationService.getStates(query);
  }

  @Get('cities')
  @Public()
  async cities(@Query() query: IndexCitiesRequest) {
    return await this.locationService.getCities(query);
  }
}
