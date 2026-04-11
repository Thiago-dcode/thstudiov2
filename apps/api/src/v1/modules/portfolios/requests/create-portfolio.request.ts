import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsBoolean, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

class PortfolioMediaItem {
  @IsNotEmpty()
  @IsNumber()
  @ModelExist('media')
  id: number;

  @IsNotEmpty()
  @IsNumber()
  position: number;
}

class PortfolioCollectionItem {
  @IsNotEmpty()
  @IsNumber()
  @ModelExist('collections')
  id: number;

  @IsNotEmpty()
  @IsNumber()
  position: number;
}

export class CreatePortfolioRequest {
  @IsString()
  @IsNotEmpty()
  title: string;

  //TODO: create endpoint to check slug availability
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters long' })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ModelExist('users')
  @IsUserAuth()
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsBoolean()
  is_highlight?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  thumbnail?: Express.Multer.File;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioMediaItem)
  media?: PortfolioMediaItem[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioCollectionItem)
  collections?: PortfolioCollectionItem[];
}

