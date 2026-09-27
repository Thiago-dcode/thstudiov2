import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
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
