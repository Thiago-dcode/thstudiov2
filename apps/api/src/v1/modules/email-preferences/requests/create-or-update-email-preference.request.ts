import { IsBoolean, IsEmail, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateOrUpdateEmailPreferenceRequest {
  @IsEmail()
  @IsString()
  email: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  user_id?: number;

  @IsOptional()
  @IsBoolean()
  transactional?: boolean;

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
