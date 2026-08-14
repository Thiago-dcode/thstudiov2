import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
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
  // Renaming never re-slugs: the slug is frozen at creation so public URLs stay stable
  // (there is no redirect table). Deliberately no `slug` field here.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

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
