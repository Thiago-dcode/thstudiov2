import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CursorPaginationRequest {
  @IsOptional()
  @IsBoolean()
  paginated?: boolean = false;

  @IsOptional()
  @IsNumber()
  last_id?: number;

  @IsOptional()
  @IsNumber()
  per_page?: number = 15;
}
