import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import {
  CREATE_OR_UPDATE_LOCATION,
  JOB_CREATE_OR_UPDATE_LOCATION,
  LOCATION_QUEUE,
} from '@repo/common-lib/constants/constants';
import type {
  City,
  Country,
  CreateOrUpdateLocationPayload,
  State,
} from '@repo/common-lib/types/location';
import { CountryRepository } from './country.repository';
import { StateRepository } from './state.repository';
import { CityRepository } from './city.repository';
import { CreateOrUpdateLocationEvent } from './events/create-or-update-location.event';

@Processor(LOCATION_QUEUE)
export class LocationProcessor extends WorkerHost {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: LOCATION_QUEUE,
  });

  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly stateRepository: StateRepository,
    private readonly cityRepository: CityRepository,
    @InjectQueue(LOCATION_QUEUE) private readonly locationQueue: Queue,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  @OnEvent(CREATE_OR_UPDATE_LOCATION)
  async handleCreateOrUpdateLocationEvent(event: CreateOrUpdateLocationEvent) {
    await this.locationQueue.add(
      JOB_CREATE_OR_UPDATE_LOCATION,
      event.payload,
      {
        jobId: `location-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  async process(job: Job): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_CREATE_OR_UPDATE_LOCATION:
          return await this.createOrUpdateLocation(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.appLogService.flushAsync();
    }
  }

  private async createOrUpdateLocation(data: CreateOrUpdateLocationPayload): Promise<{
    country: Country;
    state?: State;
    city?: City;
  }> {
    const log = this.logger.name(JOB_CREATE_OR_UPDATE_LOCATION);
    log.info('Create or update location payload', { payload: data });

    const country = (data.country ?? '').trim();
    const countryCode = (data.country_code ?? '').trim();
    const stateName = data.state?.trim();
    const cityName = data.city?.trim();

    if (!country) {
      const err = new Error(
        'CreateOrUpdateLocationPayload requires non-empty country',
      );
      log.error(err.message, err);
      throw err;
    }

    try {
      const countryRow = await this.countryRepository.upsertCountry({
        name: country,
        country_code: (countryCode || country).slice(0, 5),
      });

      let stateRow: State | undefined;
      if (stateName) {
        stateRow = await this.stateRepository.upsertState({
          country_id: countryRow.id,
          name: stateName,
        });
      }

      let cityRow: City | undefined;
      if (cityName && stateRow) {
        cityRow = await this.cityRepository.upsertCity({
          country_id: countryRow.id,
          state_id: stateRow.id,
          name: cityName,
        });
      }

      log.info('Location upsert completed', {
        country_id: countryRow.id,
        state_id: stateRow?.id,
        city_id: cityRow?.id,
      });

      return {
        country: countryRow,
        state: stateRow,
        city: cityRow,
      };
    } catch (error) {
      log.error(
        `Failed to create or update location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}
