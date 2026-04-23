import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class OffsetPaginationRequest {
  @IsOptional()
  @ToBoolean()
  paginated?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  per_page?: number = 15;
}
