import { IsBoolean, IsEmail, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateOrUpdateEmailPreferenceRequest {
  @IsEmail()
  @IsString()
  email: string;

  // Proof-of-control: must match the token issued for this email (see EmailPreferencesController).
  @IsString()
  token: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  user_id?: number;

  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  waitlist_updates?: boolean;
}
