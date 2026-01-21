import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class CreateAboutPageRequest {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  photo?: Express.Multer.File;

  @IsString()
  @IsNotEmpty()
  description: string;
 
  @IsNotEmpty()
  @IsNumber()
  @ModelExist('users')
  @IsUserAuth()
  user_id: number;
}
