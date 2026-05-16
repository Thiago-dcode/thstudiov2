import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { CategoryTranslationItem } from './category-translation-item.request';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
import { ToInt } from 'src/common/decorators/to-int.decorator';

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
  @ToInt()
  @ModelExist('categories')
  parent_id?: number;

  @IsOptional()
  @ToBoolean()
  is_featured?: boolean;

  @IsOptional()
  thumbnail?: Express.Multer.File;
}
