import { IsOptional } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexUserServiceRequest extends OffsetPaginationRequest {
  @IsOptional()
  @ToBoolean()
  is_featured?: boolean;

  @IsOptional()
  @ToBoolean()
  is_highlight?: boolean;

  @IsOptional()
  @ToBoolean()
  is_active?: boolean;

  @IsOptional()
  @ToBoolean()
  blocked?: boolean;
}
