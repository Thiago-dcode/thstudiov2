import { IsIn, IsInt, IsPositive, Max } from 'class-validator';
import {
  ALLOWED_IMAGE_FILE_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
} from '@repo/common-lib/constants/limits';
import type { MimeTypes } from '@repo/common-lib/types/general';
import { ToInt } from 'src/common/decorators/to-int.decorator';

/** Body for `POST /users/:id/upload-url` — the presigned PUT for an avatar or banner. */
export class CreateUserImageUploadUrlRequest {
  @IsIn(ALLOWED_IMAGE_FILE_TYPES)
  content_type: MimeTypes;

  @IsInt()
  @IsPositive()
  @Max(MAX_IMAGE_UPLOAD_BYTES)
  @ToInt()
  size: number;
}
