import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class IndexPaymentMethodRequest {

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}
