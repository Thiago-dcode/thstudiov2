import { IsNotEmpty, IsPositive } from 'class-validator';
import { ToInt } from 'src/common/decorators/to-int.decorator';

export class InviteWaitListBatchRequest {
  @ToInt()
  @IsNotEmpty()
  @IsPositive()
  count: number;
}
