import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { LoginRequest } from './login.request';

export class Verify2faRequest extends LoginRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}
