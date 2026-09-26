import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { MAX_MEDIA_LOCATION_BATCH } from '@repo/common-lib/constants/limits';
import type { UpdateMediaLocationsInput } from '@repo/common-lib/types/media';
import { LocationInputRequest } from '../../locations/requests/location-input.request';

export class UpdateMediaLocationsRequest implements UpdateMediaLocationsInput {
  /** The place every listed media was made. Resolved once, then stored as `location_id`. */
  @IsDefined()
  @ValidateNested()
  @Type(() => LocationInputRequest)
  location: LocationInputRequest;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_MEDIA_LOCATION_BATCH, {
    message: `Up to ${MAX_MEDIA_LOCATION_BATCH} media can be updated at once`,
  })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  media: number[];
}
