import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUserPasswordRequest {
  @IsString()
  @IsNotEmpty()
  old_password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/\d/, { message: 'password must contain at least one number' })
  @Matches(/^\S+$/, { message: 'password cannot contain spaces' })
  new_password: string;
}
