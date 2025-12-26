import {
  IsOptional,
  IsString,
  MaxLength,
  IsEmail,
  IsInt,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ModelArrayExist } from 'src/common/validators/model-array-exist.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

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
  profession?: string;

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
  @ModelExist('addresses')
  address_id?: number;

  @IsOptional()
  @IsArray()
  @ModelArrayExist('categories')
  categories?: number[];

  @IsOptional()
  avatar?: Express.Multer.File;
}
