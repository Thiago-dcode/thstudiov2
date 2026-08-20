import type { EnumType } from '@repo/common-lib/constants/enums';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
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
}
