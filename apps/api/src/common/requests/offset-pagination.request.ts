import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class OffsetPaginationRequest {
  @IsOptional()
  @IsBoolean()
  paginated?: boolean = false;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  per_page?: number = 15;
}
