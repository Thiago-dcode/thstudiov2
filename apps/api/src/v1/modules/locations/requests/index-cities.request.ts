import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class IndexCitiesRequest {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  country_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  state_id?: number;
}
