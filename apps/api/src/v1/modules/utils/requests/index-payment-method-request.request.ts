import { IsOptional } from 'class-validator';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexPaymentMethodRequest {
  @IsOptional()
  @ToBoolean()
  enabled?: boolean;
}
