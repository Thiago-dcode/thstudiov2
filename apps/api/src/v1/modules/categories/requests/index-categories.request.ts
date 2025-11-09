import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { OffsetPaginationRequest } from 'src/common/requests/offset-pagination.request';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class IndexCategoriesRequest extends OffsetPaginationRequest {
  
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search: string;

  @IsOptional()
  @IsNumber()
  @ModelExist('categories')
  parent_id: number;
}
