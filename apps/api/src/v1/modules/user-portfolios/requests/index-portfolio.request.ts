import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class IndexPortfolioRequest extends OffsetPaginationRequest {
  @IsOptional()
  @IsNumber()
  @ModelExist('users')
  user_id?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_highlight?: boolean;
}

