import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsBoolean, ValidateNested, MinLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

class CollectionMediaItem {
  @IsNotEmpty()
  @IsNumber()
  @ModelExist('media')
  id: number;

  @IsNotEmpty()
  @IsNumber()
  position: number;
}

export class CreateCollectionRequest {
  @IsString()
  @IsNotEmpty()
  title: string;

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
  @IsArray()
  @ArrayMaxSize(50, { message: 'Collections can have up to 50 media' })
  @ValidateNested({ each: true })
  @Type(() => CollectionMediaItem)
  media?: CollectionMediaItem[];
}
