import type { EnumType } from '@repo/common-lib/constants/enums';
import { SQL_ORDER_DIRECTIONS } from '@repo/common-lib/constants/database';
import { USER_NOTIFICATION_ORDER_BY_COLUMNS } from '@repo/common-lib/constants/user-notification';
import type { SqlOrderDirection } from '@repo/common-lib/types/database';
import type { UserNotificationOrderBy } from '@repo/common-lib/types/user-notification';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsISO8601, IsNumber, IsOptional } from 'class-validator';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class IndexUserNotificationRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsAvailableEnum('NOTIFICATION_TYPE')
  type?: EnumType<'NOTIFICATION_TYPE'>;

  @IsOptional()
  @ToBoolean()
  unread?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  entity_id?: number;

  @IsOptional()
  @IsISO8601()
  created_from?: string;

  @IsOptional()
  @IsISO8601()
  created_to?: string;

  /**
   * Allow-listed because the query builder interpolates the ORDER BY column into the statement.
   * `IsIn` rejects anything else instead of falling back, so a typo surfaces as a 422.
   */
  @IsOptional()
  @IsIn(USER_NOTIFICATION_ORDER_BY_COLUMNS)
  order_by?: UserNotificationOrderBy = 'created_at';

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(SQL_ORDER_DIRECTIONS)
  order?: SqlOrderDirection = 'DESC';
}
