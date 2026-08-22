import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MAX_CATEGORIES_PORTFOLIO } from '@repo/common-lib/constants/limits';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ModelArrayExist } from 'src/common/validators/model-array-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
import { ToInt } from 'src/common/decorators/to-int.decorator';
import {
  PortfolioLayoutInput,
  TransformPortfolioLayout,
} from './portfolio-layout.input';

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

export class CreatePortfolioRequest {
  // The slug is derived from this title by the service and frozen at creation — clients
  // never send one (`whitelist: true` strips it if an older client still does).
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ModelExist('users')
  @IsUserAuth()
  @IsNotEmpty()
  @ToInt()
  user_id: number;

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
  @ArrayMaxSize(MAX_CATEGORIES_PORTFOLIO, {
    message: `Portfolios can have up to ${MAX_CATEGORIES_PORTFOLIO} categories`,
  })
  @Transform(({ value }) => value?.map((v: string) => parseInt(v, 10)))
  @ModelArrayExist('categories')
  categories?: number[];

  @IsOptional()
  @TransformPortfolioLayout()
  @ValidateNested()
  @Type(() => PortfolioLayoutInput)
  layout?: PortfolioLayoutInput;
}
