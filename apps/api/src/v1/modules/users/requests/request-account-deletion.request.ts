import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestAccountDeletionRequest {
  /** Re-entered on purpose: a hijacked session or a shared laptop must not be able to schedule it. */
  @IsString()
  @IsNotEmpty()
  password: string;

  /** Stop the paid subscription's renewal now instead of on the day the account is deleted. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 'on')
  @IsBoolean()
  cancel_subscription?: boolean;
}
