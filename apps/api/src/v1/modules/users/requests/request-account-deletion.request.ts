import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class RequestAccountDeletionRequest {
  /**
   * The code emailed by `POST /users/:id/deletion/code`: a hijacked session or a shared laptop
   * must not be able to schedule this. One approach for every account, with or without a password.
   */
  @Matches(/^\d{6}$/, { message: 'code must be the 6-digit code from the email' })
  code: string;

  /** Stop the paid subscription's renewal now instead of on the day the account is deleted. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 'on')
  @IsBoolean()
  cancel_subscription?: boolean;
}
