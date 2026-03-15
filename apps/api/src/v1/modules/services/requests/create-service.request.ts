import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
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

export class CreateServiceRequest {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters long' })
  slug: string;

  @IsString()
  @IsOptional()
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

  @ModelExist('users')
  @IsUserAuth()
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

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
