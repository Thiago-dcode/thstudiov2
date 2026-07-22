import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';
import type { EnumType } from '@repo/common-lib/constants/enums';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ModelNotExist } from 'src/common/validators/model-not-exist.validtor';

export class CreateInvitationLinkRequest {

  @IsNotEmpty()
  @IsAvailableEnum('BENEFIT_TYPE')
  @ModelExist('benefits', 'type')
  benefit_type: EnumType<'BENEFIT_TYPE'>;

  @IsOptional()
  @IsInt()
  @IsPositive()
  max_uses?: number = 1;

  @IsOptional()
  @IsInt()
  @IsPositive()
  days_to_expire?: number = 12;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @ModelNotExist('users', 'email', {
    message: 'Email already claimed',
  })
  email?: string;

  @IsOptional()
  @IsAvailableEnum('LANGUAGE_CODE')
  language?: EnumType<'LANGUAGE_CODE'>;
}
