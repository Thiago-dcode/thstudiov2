import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, MinLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_COLLECTION_ITEMS } from '@repo/common-lib/constants/constants';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

class CollectionMediaItem {
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
  @ToBoolean()
  is_highlight?: boolean;

  @IsOptional()
  @ToBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_COLLECTION_ITEMS, { message: `Collections can have up to ${MAX_COLLECTION_ITEMS} media` })
  @ValidateNested({ each: true })
  @Type(() => CollectionMediaItem)
  media?: CollectionMediaItem[];
}
