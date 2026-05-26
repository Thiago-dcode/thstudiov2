import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ModelArrayExist } from 'src/common/validators/model-array-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
import { ToInt } from 'src/common/decorators/to-int.decorator';

class PortfolioMediaItem {
  @IsNotEmpty()
  @ToInt()
  @ModelExist('media')
  id: number;

  @IsNotEmpty()
  @ToInt()
  position: number;
}

class PortfolioCollectionItem {
  @IsNotEmpty()
  @ToInt()
  @ModelExist('collections')
  id: number;

  @IsNotEmpty()
  @ToInt()
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

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value?.map((v: string) => parseInt(v, 10)))
  @ModelArrayExist('categories')
  categories?: number[];
}
