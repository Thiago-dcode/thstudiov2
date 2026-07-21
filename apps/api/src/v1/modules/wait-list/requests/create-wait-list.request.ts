import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';

export class CreateWaitListRequest {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @ModelNotExist('users','email',{
    message:"Email already claimed"
  })
  email: string;
}
