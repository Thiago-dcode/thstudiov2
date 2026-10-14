import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { EnumType } from '@repo/common-lib/constants/enums';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const trimmedOrNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/** Public notice about allegedly illegal content (DSA art. 16). */
export class CreateContentReportRequest {
  /** Must point at this site; the service checks the host. */
  @Transform(trimmed)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  @MaxLength(2048)
  reported_url: string;

  @IsAvailableEnum('CONTENT_REPORT_REASON')
  reason: EnumType<'CONTENT_REPORT_REASON'>;

  /** Art. 16(2)(a): a sufficiently substantiated explanation of why the content is illegal. */
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(5000)
  explanation: string;

  /** Optional: the DSA lets notices be anonymous except for some IP claims. */
  @IsOptional()
  @Transform(trimmedOrNull)
  @IsString()
  @MaxLength(255)
  reporter_name: string | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null,
  )
  @IsEmail()
  @MaxLength(255)
  reporter_email: string | null;

  /** Art. 16(2)(d): statement that the notice is accurate and made in good faith. */
  @Transform(({ value }) => value === true || value === 'true' || value === 'on')
  @Equals(true, { message: 'You must confirm the report is accurate and made in good faith' })
  good_faith: boolean;
}
