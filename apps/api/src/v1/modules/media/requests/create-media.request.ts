import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
// import { ModelExist } from 'src/common/validators/model-exist.validtor';
// import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import type { EnumType } from '@repo/common-lib/constants/enums';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';
 import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class CreateMediaRequest {
  
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

   @ModelExist('users')
   @IsUserAuth()
  @IsNotEmpty()
  @IsNumber()
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

  @IsString()
  @IsOptional()
  seo_filename?: string;

  @IsOptional()
  @IsAvailableEnum('COMPRESSION_LEVEL')
  compression_level: EnumType<'COMPRESSION_LEVEL'>;

  @IsOptional()
  media: Express.Multer.File;

}
