import { IsEmail, IsNotEmpty } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class PasswordRecoveryRequest {
  @IsEmail()
  @IsNotEmpty()
  @ModelExist('users', 'email')
  email: string;
  // `fallback_url` is deliberately NOT accepted from the client: it is rendered as the
  // reset link in the recovery email, so a client-supplied value let an attacker
  // redirect a genuine email's button (with the valid code) to their own site.
  // AuthService builds it from `app.url` instead.
}
