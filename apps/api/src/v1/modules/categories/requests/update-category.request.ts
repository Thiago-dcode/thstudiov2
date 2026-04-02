import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { CategoryTranslationItem } from './category-translation-item.request';

export class UpdateCategoryRequest {
  @IsString()
  @IsOptional()
  name?: string;

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
