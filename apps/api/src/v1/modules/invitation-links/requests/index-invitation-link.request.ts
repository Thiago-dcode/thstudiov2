import type { EnumType } from '@repo/common-lib/constants/enums';
import { IsOptional } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexInvitationLinkRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsAvailableEnum('BENEFIT_TYPE')
  benefit_type?: EnumType<'BENEFIT_TYPE'>;

  @IsOptional()
  @ToBoolean()
  active?: boolean;
}
