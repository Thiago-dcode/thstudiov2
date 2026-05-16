import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToInt } from 'src/common/decorators/to-int.decorator';

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
  @ToInt()
  @ModelExist('users')
  @IsUserAuth()
  user_id: number;
}
