import { IsEmail, IsNotEmpty } from 'class-validator';
import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';

export class CreateWaitListRequest {
  @IsEmail()
  @IsNotEmpty()
  @ModelNotExist('wait_list', 'email')
  email: string;
}
