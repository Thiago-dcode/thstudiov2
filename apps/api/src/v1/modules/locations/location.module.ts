import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LOCATION_QUEUE } from '@repo/common-lib/constants/constants';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationProcessor } from './location.processor';
import { CountryRepository } from './country.repository';
import { StateRepository } from './state.repository';
import { CityRepository } from './city.repository';

@Module({
  imports: [BullModule.registerQueue({ name: LOCATION_QUEUE })],
  controllers: [LocationController],
  providers: [
    LocationService,
    LocationProcessor,
    CountryRepository,
    StateRepository,
    CityRepository,
  ],
  exports: [LocationService],
})
export class LocationModule {}
