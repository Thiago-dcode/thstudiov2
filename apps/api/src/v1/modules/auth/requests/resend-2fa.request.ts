import { IsEmail, IsNotEmpty } from 'class-validator';

export class Resend2faRequest {
  // No ModelExist check: an unknown email gets the same generic 401 as a banned one.
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
