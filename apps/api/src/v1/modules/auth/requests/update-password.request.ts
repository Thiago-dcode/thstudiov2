import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class UpdatePasswordRequest {
  @IsNumber()
  @IsNotEmpty()
  @ModelExist('password_recovery_attempts', 'id')
  password_recovery_attempt_id: number;
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
