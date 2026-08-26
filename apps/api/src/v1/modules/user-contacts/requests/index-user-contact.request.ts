import { SQL_ORDER_DIRECTIONS } from '@repo/common-lib/constants/database';
import { USER_CONTACT_ORDER_BY_COLUMNS } from '@repo/common-lib/constants/user-contact';
import type { SqlOrderDirection } from '@repo/common-lib/types/database';
import type { UserContactOrderBy } from '@repo/common-lib/types/user-contact';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';

export class IndexUserContactRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

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
  @IsIn(USER_CONTACT_ORDER_BY_COLUMNS)
  order_by?: UserContactOrderBy = 'created_at';

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(SQL_ORDER_DIRECTIONS)
  order?: SqlOrderDirection = 'DESC';
}
