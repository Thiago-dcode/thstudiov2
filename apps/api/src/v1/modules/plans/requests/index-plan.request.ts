import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class IndexPlanRequest {

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;
}
