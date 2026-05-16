import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
import { ToInt } from 'src/common/decorators/to-int.decorator';

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

  @IsOptional()
  @ToInt()
  @ModelExist('portfolios')
  portfolio_id?: number;

  @IsOptional()
  thumbnail?: Express.Multer.File;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
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

  @ModelExist('users')
  @IsUserAuth()
  @IsNotEmpty()
  @ToInt()
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
