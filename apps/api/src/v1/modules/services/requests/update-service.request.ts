import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
import { ToInt } from 'src/common/decorators/to-int.decorator';
import { ToPrice } from 'src/common/decorators/to-price.decorator';

class ServiceFeatureItem {
  @IsNotEmpty()
  @IsString()
  title: string;
}

class ServiceTermItem {
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class UpdateServiceRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters long' })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ToInt()
  @ModelExist('portfolios')
  portfolio_id?: number;

  @IsOptional()
  thumbnail?: Express.Multer.File;

  @IsOptional()
  @ToPrice()
  price?: number;

  @IsOptional()
  @ToBoolean()
  is_active?: boolean;

  @IsOptional()
  @ToBoolean()
  show_price?: boolean;

  @IsOptional()
  @ToBoolean()
  is_highlight?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFeatureItem)
  features?: ServiceFeatureItem[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceTermItem)
  terms?: ServiceTermItem[];
}
