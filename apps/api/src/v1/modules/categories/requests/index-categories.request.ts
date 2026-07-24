import type { EnumType } from '@repo/common-lib/constants/enums';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { ModelArrayExist } from 'src/common/validators/model-array-exist.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexCategoriesRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search: string;

  @IsOptional()
  @ToBoolean()
  random?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ModelExist('categories')
  parent_id: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @ModelArrayExist('categories')
  categories?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) {
      return value.map(String).map((s) => s.trim()).filter((s) => s.length > 0);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return undefined;
  })
  slugs?: string[];

  @IsOptional()
  @ToBoolean()
  is_featured?: boolean;

  @IsOptional()
  @ToBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsAvailableEnum('CATEGORY_TYPE')
  type?: EnumType<'CATEGORY_TYPE'>;

  @IsOptional()
  @ToBoolean()
  exclude_parents?: boolean;

  @IsOptional()
  @ToBoolean()
  with_thumbnail?: boolean;
}
