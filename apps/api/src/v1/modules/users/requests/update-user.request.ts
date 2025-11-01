import {
  IsOptional,
  IsString,
  MaxLength,
  IsEmail,
  IsInt,
  IsNumber,
} from 'class-validator';
import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';

export class UpdateUserRequest {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  surname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  funnel_step?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  short_biography?: string;

  @IsOptional()
  @IsInt()
  @ModelNotExist('addresses')
  address_id?: number;

  @IsOptional()
  avatar?: Express.Multer.File;
}
