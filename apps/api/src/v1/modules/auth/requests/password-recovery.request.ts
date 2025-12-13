import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class PasswordRecoveryRequest {
  @IsEmail()
  @IsNotEmpty()
  @ModelExist('users', 'email')
  email: string;
  @IsString()
  @IsNotEmpty()
  fallback_url: string;
}
