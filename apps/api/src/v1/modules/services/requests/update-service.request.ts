import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

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

  @IsNumber()
  @IsOptional()
  @ModelExist('portfolios')
  portfolio_id?: number;
  @IsOptional()
  thumbnail?: Express.Multer.File;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  show_price?: boolean;

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
