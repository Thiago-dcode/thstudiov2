import type { EnumType } from '@repo/common-lib/constants/enums';
import { IsOptional } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class IndexWaitListRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsAvailableEnum('WAIT_LIST_STATUS')
  status?: EnumType<'WAIT_LIST_STATUS'>;
}
