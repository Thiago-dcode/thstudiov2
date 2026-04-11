import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { CategoryTranslationItem } from './category-translation-item.request';
import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';

export class CreateCategoryRequest {
  @IsString()
  @IsNotEmpty()
  @ModelNotExist('categories', 'name')
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationItem)
  translations?: CategoryTranslationItem[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ModelExist('categories')
  parent_id?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_featured?: boolean;

  @IsOptional()
  thumbnail?: Express.Multer.File;
}
