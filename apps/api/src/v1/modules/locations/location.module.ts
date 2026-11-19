import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LOCATION_QUEUE } from '@repo/common-lib/constants/queues';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationProcessor } from './location.processor';
import { CountryRepository } from './country.repository';
import { StateRepository } from './state.repository';
import { CityRepository } from './city.repository';
import { LocationRepository } from './location.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    BullModule.registerQueue({ name: LOCATION_QUEUE }),
  ],
  controllers: [LocationController],
  providers: [
    LocationService,
    LocationProcessor,
    CountryRepository,
    StateRepository,
    CityRepository,
    LocationRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'locations',
        });
      },
    },
  ],
  exports: [LocationService],
})
export class LocationModule {}
