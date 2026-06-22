import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class LoginRequest {
  @IsEmail()
  @IsNotEmpty()
  @ModelExist('users', 'email',{
    message:"Invalid credentials"
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

}
