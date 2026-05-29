import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexPortfolioRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ModelExist('users')
  user_id?: number;

  @IsOptional()
  @ToBoolean()
  is_featured?: boolean;

  @IsOptional()
  @ToBoolean()
  is_highlight?: boolean;

  @IsOptional()
  @ToBoolean()
  is_active?: boolean;

  @IsOptional()
  @ToBoolean()
  blocked?: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

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
  categories?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  state?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  country?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius_km?: number = 50;
}
