import { SQL_ORDER_DIRECTIONS } from '@repo/common-lib/constants/database';
import type { EnumType } from '@repo/common-lib/constants/enums';
import { MEDIA_ORDER_BY_COLUMNS } from '@repo/common-lib/constants/media';
import type { SqlOrderDirection } from '@repo/common-lib/types/database';
import type { MediaOrderBy } from '@repo/common-lib/types/media';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
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
  is_value_pillars?: boolean;

  @IsOptional()
  @ToBoolean()
  is_highlight?: boolean;

  @IsOptional()
  @ToBoolean()
  completed?: boolean;

  @IsOptional()
  @IsAvailableEnum('MEDIA_SHAPE')
  shape?: EnumType<'MEDIA_SHAPE'>;

  @IsOptional()
  @IsAvailableEnum('MEDIA_TYPE')
  media_type?: EnumType<'MEDIA_TYPE'>;

  @IsOptional()
  @ToBoolean()
  blocked?: boolean;

  @IsOptional()
  @ToBoolean()
  compact?: boolean = true;

  /**
   * Allow-listed because the query builder interpolates the ORDER BY column into the statement.
   * `IsIn` rejects anything else instead of falling back, so a typo surfaces as a 422.
   */
  @IsOptional()
  @IsIn(MEDIA_ORDER_BY_COLUMNS)
  order_by?: MediaOrderBy = 'created_at';

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(SQL_ORDER_DIRECTIONS)
  order?: SqlOrderDirection = 'DESC';
}
