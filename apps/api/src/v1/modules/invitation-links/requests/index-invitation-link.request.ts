import type { EnumType } from '@repo/common-lib/constants/enums';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class IndexInvitationLinkRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsAvailableEnum('BENEFIT_TYPE')
  benefit_type?: EnumType<'BENEFIT_TYPE'>;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;
}
