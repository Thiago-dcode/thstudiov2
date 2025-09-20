import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthRegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @ModelNotExist('users', 'email')
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
