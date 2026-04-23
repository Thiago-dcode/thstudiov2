import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexCollectionRequest extends OffsetPaginationRequest {
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
  is_highlight?: boolean;

  @IsOptional()
  @ToBoolean()
  is_active?: boolean;

  @IsOptional()
  @ToBoolean()
  blocked?: boolean;
}
