import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';
import { NotIn } from 'src/common/validators/not-in.validtor';
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
import { normalizeUsername } from '@repo/common-lib/utils/username';

const FORBIDDEN_USERNAMES = [
  'admin',
  'a11studio',
  'a11studio_support',
  'www',
  'legal',
  'support',
  'billing',
  'moderator',
  'moderators',
  'staff',
  'security',
  'system',
  'root',
  'verification',
] as const;

export class RegisterRequest {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  @ModelNotExist('users', 'email')
  email: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeUsername(value) : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9]+$/, {
    message: 'username must be alphanumeric with no spaces',
  })
  @NotIn([...FORBIDDEN_USERNAMES], {
    message: 'username is not allowed',
  })
  @ModelNotExist('users', 'username')
  username: string;

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
}
