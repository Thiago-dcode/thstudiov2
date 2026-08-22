import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  LOCATION_QUEUE,
  LOG_QUEUE,
} from '@repo/common-lib/constants/queues';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationProcessor } from './location.processor';
import { CountryRepository } from './country.repository';
import { StateRepository } from './state.repository';
import { CityRepository } from './city.repository';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

@Module({
  imports: [
    BullModule.registerQueue({ name: LOCATION_QUEUE }, { name: LOG_QUEUE }),
  ],
  controllers: [LocationController],
  providers: [
    LocationService,
    LocationProcessor,
    CountryRepository,
    StateRepository,
    CityRepository,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'locations',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  exports: [LocationService],
})
export class LocationModule {}
