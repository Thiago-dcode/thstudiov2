import { IsNumber, Max, Min } from 'class-validator';
import { MAX_VIDEO_DURATION_SECONDS } from '@repo/common-lib/constants/limits';
import type { UpdateMediaThumbnailTimeInput } from '@repo/common-lib/types/media';

/**
 * Body for `PATCH /media/:id/thumbnail-time`: the second of the video to use as its cover.
 * Bounded by the longest video accepted; the worker clamps it into this video's own length.
 */
export class UpdateMediaThumbnailTimeRequest implements UpdateMediaThumbnailTimeInput {
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  @Min(0)
  @Max(MAX_VIDEO_DURATION_SECONDS)
  thumbnail_time_seconds: number;
}
