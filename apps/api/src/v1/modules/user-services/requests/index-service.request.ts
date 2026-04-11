import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';

export class IndexUserServiceRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_highlight?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;
}
