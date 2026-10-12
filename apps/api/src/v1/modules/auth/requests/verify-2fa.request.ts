import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
export class Verify2faRequest {
  @IsEmail()
  @IsNotEmpty()
  @ModelExist('users', 'email')
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'The code must be 6 digits' })
  twofa_code: string;
}
