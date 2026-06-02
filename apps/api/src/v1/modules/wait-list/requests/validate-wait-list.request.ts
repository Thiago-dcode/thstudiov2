import { IsNotEmpty, IsUUID } from 'class-validator';

export class ValidateWaitListRequest {
  @IsUUID()
  @IsNotEmpty()
  token: string;
}
