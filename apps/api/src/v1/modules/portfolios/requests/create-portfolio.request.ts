import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
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
}
