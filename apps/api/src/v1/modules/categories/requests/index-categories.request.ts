import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { ModelArrayExist } from 'src/common/validators/model-array-exist.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class IndexCategoriesRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search: string;

  @IsOptional()
  @IsBoolean()
  random?: boolean;

  @IsOptional()
  @IsNumber()
  @ModelExist('categories')
  parent_id: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @ModelArrayExist('categories')
  categories?: number[];
}
