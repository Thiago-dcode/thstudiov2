import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';
import { NotIn } from 'src/common/validators/not-in.validtor';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

const FORBIDDEN_USERNAMES = [
  'admin',
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
  @ModelNotExist('wait_list', 'email', {
    extraConditions: [['validated_at', '!=', null]],
    message: 'email already exists in wait list',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'username must be alphanumeric with no spaces',
  })

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'username must be alphanumeric with no spaces',
  })
  @NotIn([...FORBIDDEN_USERNAMES], {
    message: 'username is not allowed',
  }, false)
  @ModelNotExist('users', 'username')
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/\d/, { message: 'password must contain at least one number' })
  @Matches(/^\S+$/, { message: 'password cannot contain spaces' })
  password: string;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === '1' || value === 1,
  )
  email_validated: boolean = false;

  @IsString()
  @IsOptional()
  invitation_code?: string;
}
