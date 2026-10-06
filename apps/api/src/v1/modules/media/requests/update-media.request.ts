import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MAX_CATEGORIES_MEDIA } from '@repo/common-lib/constants/limits';
import { LocationInputRequest } from '../../locations/requests/location-input.request';

export class UpdateMediaRequest {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** The place the work was made; `null` clears it, absent leaves it unchanged. */
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationInputRequest)
  location?: LocationInputRequest | null;

  /**
   * The artist's disciplines / art styles. Replaces the media's current ones; an empty array clears
   * them (the AI then picks next time it generates metadata), absent leaves them unchanged.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_CATEGORIES_MEDIA)
  @ArrayUnique()
  @IsInt({ each: true })
  category_ids?: number[];

  @IsString()
  @IsOptional()
  seo_alt?: string;

  @IsString()
  @IsOptional()
  seo_title?: string;

  @IsString()
  @IsOptional()
  seo_description?: string;

  /**
   * The owner's visibility switch: an inactive media is left out of every public read (its own
   * page, portfolios, collections). Moderation uses `blocked_at`, which the owner cannot touch.
   */
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
