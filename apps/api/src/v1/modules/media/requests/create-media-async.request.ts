import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { EnumType } from '@repo/common-lib/constants/enums';
import { ALLOWED_FILE_TYPES } from '@repo/common-lib/constants/limits';
import type { MimeTypes } from '@repo/common-lib/types/general';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
import { ToInt } from 'src/common/decorators/to-int.decorator';

/**
 * Body for `POST /media/async`. A sibling of `CreateMediaRequest`, not a variant of it: that
 * DTO carries a multer `media: Express.Multer.File` for the still-multipart sync `POST /media`,
 * and this endpoint no longer accepts a file at all — the browser has already PUT the bytes
 * straight to S3 via a presigned URL from `POST /media/upload-url`. This body is plain JSON.
 */
export class CreateMediaAsyncRequest {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ModelExist('users')
  @IsUserAuth()
  @IsNotEmpty()
  @ToInt()
  user_id: number;

  @IsString()
  @IsOptional()
  seo_alt?: string;

  @IsString()
  @IsOptional()
  seo_title?: string;

  @IsString()
  @IsOptional()
  seo_description?: string;

  @IsOptional()
  @ToBoolean()
  generate_metadata?: boolean;

  @IsOptional()
  @IsAvailableEnum('COMPRESSION_LEVEL')
  compression_level: EnumType<'COMPRESSION_LEVEL'>;

  // The uuid `POST /media/upload-url` returned. The API rebuilds the full temp key
  // (`users/{public_id}/__TEMP__/{upload_id}`) from this plus the authenticated user, so the
  // client cannot express a storage path — a stolen uuid from another session resolves under
  // the CALLER's own prefix, where nothing exists.
  @IsUUID('4')
  @IsNotEmpty()
  upload_id: string;

  // The upload's real filename, for the seo_filename slug and the stored object's extension —
  // same role `file.originalname` played on the multipart endpoint.
  @IsString()
  @IsNotEmpty()
  original_name: string;

  // Declared media type. Same trust level as the multipart endpoint's `file.mimetype`: both are
  // client-declared, and neither is trusted for the object's stored `Content-Type`, which is
  // always re-derived from the destination key (`S3StorageService.move`).
  @IsIn(ALLOWED_FILE_TYPES)
  content_type: MimeTypes;
}
