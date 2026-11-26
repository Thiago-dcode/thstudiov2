import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TURNSTILE_TOKEN_MAX_LENGTH } from '@repo/common-lib/constants/turnstile';

export class RegisterRequest {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  @ModelNotExist('users', 'email')
  email: string;

  // No `username`: the API generates one at sign-up and onboarding replaces it from the
  // name (`whitelist: true` strips it if an older client still sends one).

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/\d/, { message: 'password must contain at least one number' })
  @Matches(/^\S+$/, { message: 'password cannot contain spaces' })
  password: string;

  // `email_validated` is deliberately NOT accepted from the client. It is the
  // proof-of-email gate in `AuthService.handleLogin`, so allowing registration to set
  // it let anyone create a pre-verified account for an address they do not own.
  // Only the server sets it, after the emailed code is verified.

  @IsString()
  @IsOptional()
  invitation_code?: string;

  // Cloudflare Turnstile token, verified by `TurnstileGuard` (`@RequireTurnstile` on the route) in
  // every environment before this DTO is validated, so a missing or invalid token is a 403 first.
  // `AuthService.register` never reads it. The name must keep `token` so log redaction hides it.
  @IsString()
  @MaxLength(TURNSTILE_TOKEN_MAX_LENGTH)
  turnstile_token: string;
}
