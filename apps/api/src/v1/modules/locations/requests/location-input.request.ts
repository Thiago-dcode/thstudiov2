import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import type { LocationInput } from '@repo/common-lib/types/location';

/**
 * A picked place (one geocoder feature, flattened), nested in media create / update bodies.
 * The API resolves it into a `locations` row; the caps mirror the column sizes. These values
 * are client-declared — they reach the AI prompt only inside its DATA block.
 */
export class LocationInputRequest implements LocationInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  place_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  formatted: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  result_type: string | null;

  @IsOptional()
  @IsLatitude()
  latitude: number | null;

  @IsOptional()
  @IsLongitude()
  longitude: number | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string;

  @IsString()
  @Length(2, 5)
  country_code: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  state?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string | null;
}
