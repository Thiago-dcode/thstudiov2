import { IsEmail, IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class CreateUserContactRequest {
  @IsNotEmpty()
  @IsNumber()
  @ModelExist('users')
  user_id: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  contact_name: string;

  @IsNotEmpty()
  @IsEmail()
  contact_email: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  subject: string;
}
