import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class IndexStatesRequest {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  country_id?: number;
}
