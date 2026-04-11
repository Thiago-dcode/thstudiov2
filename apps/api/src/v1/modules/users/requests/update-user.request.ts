import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsInt,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
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
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'username must be alphanumeric with no spaces',
  })
  username?: string;

  @IsOptional()
  @IsString()
  biography?: string;

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
  @Transform(({ value }) => value?.map((v: string) => parseInt(v, 10)))
  @ModelArrayExist('categories')
  categories?: number[];

  @IsOptional()
  avatar?: Express.Multer.File;

  @IsOptional()
  banner?: Express.Multer.File;
}
