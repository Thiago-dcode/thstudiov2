import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class CheckPasswordRecoveryAttemptRequest {
  @IsEmail()
  @IsNotEmpty()
  @ModelExist('users', 'email')
  email: string;
 @IsString()
 @IsNotEmpty()
 code: string;
}
