import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsBoolean, ValidateNested, MinLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
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

export class UpdateCollectionRequest {
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
