import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
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

export class UpdatePortfolioRequest {
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

