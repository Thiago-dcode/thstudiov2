import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsPositive,
} from 'class-validator';
import {
  MAX_CATEGORIES_MEDIA,
  MAX_MEDIA_CATEGORIES_BATCH,
} from '@repo/common-lib/constants/limits';
import type { UpdateMediaCategoriesInput } from '@repo/common-lib/types/media';

export class UpdateMediaCategoriesRequest implements UpdateMediaCategoriesInput {
  /** The disciplines / art styles to apply. Filtered down to what the picker offers. */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_CATEGORIES_MEDIA)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  category_ids: number[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_MEDIA_CATEGORIES_BATCH, {
    message: `Up to ${MAX_MEDIA_CATEGORIES_BATCH} media can be updated at once`,
  })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  media: number[];

  /** `true` replaces each media's categories; `false` adds to them. */
  @IsBoolean()
  replace: boolean;
}
