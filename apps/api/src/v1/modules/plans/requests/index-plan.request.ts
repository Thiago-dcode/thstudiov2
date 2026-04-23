import { IsOptional } from 'class-validator';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';

export class IndexPlanRequest {
  @IsOptional()
  @ToBoolean()
  is_active?: boolean;
}
