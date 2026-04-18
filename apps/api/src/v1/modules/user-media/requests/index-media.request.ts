import type { EnumType } from '@repo/common-lib/constants/enums';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class IndexMediaRequest extends OffsetPaginationRequest {

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @ModelExist('users')
  user_id?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_highlight?: boolean;

  @IsOptional()
  @IsAvailableEnum('MEDIA_SHAPE')
  shape?: EnumType<'MEDIA_SHAPE'>;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  blocked?: boolean;
}

