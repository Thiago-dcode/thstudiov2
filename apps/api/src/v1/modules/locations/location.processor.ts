import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  JOB_CREATE_OR_UPDATE_LOCATION,
  LOCATION_QUEUE,
} from '@repo/common-lib/constants/queues';
import type {
  City,
  Country,
  CreateOrUpdateLocationPayload,
  State,
} from '@repo/common-lib/types/location';
import { LocationService } from './location.service';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { apiLogger } from 'src/common/services/request.service';

@Processor(LOCATION_QUEUE)
export class LocationProcessor extends GlobalProcessor {
  constructor(
    private readonly locationService: LocationService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case JOB_CREATE_OR_UPDATE_LOCATION:
        return await this.createOrUpdateLocation(job.data);

      default:
        throw new Error(`Job name "${job.name}" not recognized`);
    }
  }

  private async createOrUpdateLocation(data: CreateOrUpdateLocationPayload): Promise<{
    country: Country;
    state?: State;
    city?: City;
  }> {
    // A literal channel, not the queue constant: channels are a closed set named after the module.
    const log = apiLogger('locations', { operation: JOB_CREATE_OR_UPDATE_LOCATION });
    log.info('Create or update location payload', { payload: data });

    try {
      const { country, state, city } = await this.locationService.upsertHierarchy(data);

      log.info('Location upsert completed', {
        country_id: country.id,
        state_id: state?.id,
        city_id: city?.id,
      });

      return { country, state, city };
    } catch (error) {
      log.error(
        `Failed to create or update location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}
