import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

class PortfolioMediaItem {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ModelExist('media')
  id: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  position: number;
}

class PortfolioCollectionItem {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ModelExist('collections')
  id: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
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
  @ToBoolean()
  is_highlight?: boolean;

  @IsOptional()
  @ToBoolean()
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
