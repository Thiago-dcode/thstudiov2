import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt, IsPositive } from 'class-validator';
import { MAX_MEDIA_DELETE_BATCH } from '@repo/common-lib/constants/limits';
import type { DeleteManyMediaInput } from '@repo/common-lib/types/media';

export class DeleteManyMediaRequest implements DeleteManyMediaInput {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_MEDIA_DELETE_BATCH, {
    message: `Up to ${MAX_MEDIA_DELETE_BATCH} media can be deleted at once`,
  })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  media: number[];
}
