import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt, IsPositive } from 'class-validator';
import { MAX_MEDIA_METADATA_BATCH } from '@repo/common-lib/constants/limits';

export class GenerateManyMediaMetadataRequest {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_MEDIA_METADATA_BATCH, {
    message: `Up to ${MAX_MEDIA_METADATA_BATCH} media can be generated at once`,
  })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  media: number[];
}
