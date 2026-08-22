import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MAX_CATEGORIES_USER } from '@repo/common-lib/constants/limits';
import {
  PHONE_REGEX,
  PHONE_MAX_LENGTH,
  LINK_MAX_LENGTH,
  INSTAGRAM_URL_REGEX,
  FACEBOOK_URL_REGEX,
  YOUTUBE_URL_REGEX,
  WEBSITE_URL_REGEX,
  normalizeFacebookLink,
  normalizeInstagramLink,
  normalizePhone,
  normalizeYoutubeLink,
} from '@repo/common-lib/constants/validation';
import { normalizeUsername } from '@repo/common-lib/utils/username';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
import { ToInt } from 'src/common/decorators/to-int.decorator';
import { ModelArrayExist } from 'src/common/validators/model-array-exist.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

/** Trim a string field; convert an emptied value to `null` so it clears the column. */
const emptyToNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** Normalize a phone (strip spaces/dashes/parens); convert an emptied value to `null` to clear it. */
const normalizePhoneOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const normalized = normalizePhone(value.trim());
  return normalized === '' ? null : normalized;
};

/** Expand bare social handles to official URLs; empty → `null` to clear the column. */
const normalizeInstagramOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const normalized = normalizeInstagramLink(value);
  return normalized === '' ? null : normalized;
};

const normalizeFacebookOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const normalized = normalizeFacebookLink(value);
  return normalized === '' ? null : normalized;
};

const normalizeYoutubeOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const normalized = normalizeYoutubeLink(value);
  return normalized === '' ? null : normalized;
};

export class UpdateUserRequest {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  surname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  profession?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeUsername(value) : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9]+$/, {
    message: 'username must be alphanumeric with no spaces',
  })
  username?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @ToInt()
  funnel_step?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  short_biography?: string;

  @IsOptional()
  @ToInt()
  @ModelExist('addresses')
  address_id?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_CATEGORIES_USER, {
    message: `Users can have up to ${MAX_CATEGORIES_USER} categories`,
  })
  @Transform(({ value }) => value?.map((v: string) => parseInt(v, 10)))
  @ModelArrayExist('categories')
  categories?: number[];

  @IsOptional()
  @Transform(normalizePhoneOrNull)
  @IsString()
  @MaxLength(PHONE_MAX_LENGTH)
  @Matches(PHONE_REGEX, {
    message: 'phone_number must be a valid phone number (9–15 digits, optional +country code)',
  })
  phone_number?: string | null;

  @IsOptional()
  @Transform(normalizeFacebookOrNull)
  @IsString()
  @MaxLength(LINK_MAX_LENGTH)
  @Matches(FACEBOOK_URL_REGEX, {
    message: 'facebook_link must be a valid Facebook URL (https://facebook.com/...)',
  })
  facebook_link?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(LINK_MAX_LENGTH)
  @Matches(WEBSITE_URL_REGEX, {
    message: 'website_link must be a valid URL (https://example.com)',
  })
  website_link?: string | null;

  @IsOptional()
  @Transform(normalizeInstagramOrNull)
  @IsString()
  @MaxLength(LINK_MAX_LENGTH)
  @Matches(INSTAGRAM_URL_REGEX, {
    message: 'instagram_link must be a valid Instagram URL (https://instagram.com/handle)',
  })
  instagram_link?: string | null;

  @IsOptional()
  @Transform(normalizeYoutubeOrNull)
  @IsString()
  @MaxLength(LINK_MAX_LENGTH)
  @Matches(YOUTUBE_URL_REGEX, {
    message: 'youtube_link must be a valid YouTube URL (https://youtube.com/@handle)',
  })
  youtube_link?: string | null;

  @IsOptional()
  avatar?: Express.Multer.File;

  @IsOptional()
  banner?: Express.Multer.File;

  /** When true and no new banner file is uploaded, clears the stored banner. */
  @IsOptional()
  @ToBoolean()
  remove_banner?: boolean;
}
