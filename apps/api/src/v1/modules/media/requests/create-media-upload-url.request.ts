import { IsIn, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { ALLOWED_FILE_TYPES } from '@repo/common-lib/constants/limits';
import type { MimeTypes } from '@repo/common-lib/types/general';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToInt } from 'src/common/decorators/to-int.decorator';

export class CreateMediaUploadUrlRequest {
  @ModelExist('users')
  @IsUserAuth()
  @IsNotEmpty()
  @ToInt()
  user_id: number;

  @IsString()
  @IsNotEmpty()
  filename: string;

  // The per-type cap (`MediaHelper.maxUploadBytes`) is checked in the service against `size`,
  // not here: it needs both fields at once, and class-validator's single-property decorators
  // are the wrong tool for a cross-field check this simple.
  @IsIn(ALLOWED_FILE_TYPES)
  content_type: MimeTypes;

  @IsInt()
  @IsPositive()
  @ToInt()
  size: number;
}
