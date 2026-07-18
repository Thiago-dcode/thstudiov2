import { IsOptional } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexLayoutsRequest extends OffsetPaginationRequest {
  @IsOptional()
  @ToBoolean()
  is_active?: boolean;
}
