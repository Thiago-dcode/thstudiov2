import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
export class Verify2faRequest {
  @IsEmail()
  @IsNotEmpty()
  @ModelExist('users', 'email')
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  twofa_code: string; 

  @IsString()
  @IsOptional()
  user_agent: string;

  @IsString()
  @IsOptional()
  ip_address: string;
}
