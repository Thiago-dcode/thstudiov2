import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class UpdatePasswordRequest {
  @IsString()
  @IsNotEmpty()
  @ModelExist('password_recovery_attempts', 'code')
  code: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
