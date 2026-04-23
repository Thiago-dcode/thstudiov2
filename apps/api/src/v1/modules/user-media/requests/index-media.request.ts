import type { EnumType } from '@repo/common-lib/constants/enums';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexMediaRequest extends OffsetPaginationRequest {

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ModelExist('users')
  user_id?: number;

  @IsOptional()
  @ToBoolean()
  is_featured?: boolean;

  @IsOptional()
  @ToBoolean()
  is_highlight?: boolean;

  @IsOptional()
  @IsAvailableEnum('MEDIA_SHAPE')
  shape?: EnumType<'MEDIA_SHAPE'>;

  @IsOptional()
  @ToBoolean()
  blocked?: boolean;
}
