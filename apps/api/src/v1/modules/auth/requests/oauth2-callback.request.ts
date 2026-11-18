import type { OauthCallback, OauthProviders } from '@repo/common-lib/types/auth';
import { IsNotEmpty, IsOptional, IsString, IsUrl, Matches } from 'class-validator';
import { config } from '@repo/common-lib/config';
import { IsValidOrigin } from 'src/common/decorators/is-valid-origin';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class Oauth2CallbackRequest implements OauthCallback {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  @IsValidOrigin(config().app.allowedOrigins)
  redirect_uri: string;

  // PKCE verifier (RFC 7636 allows 43-128 unreserved chars); ours is base64url, so `.` and `~` never occur.
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43,128}$/)
  code_verifier: string;

  @IsString()
  @IsNotEmpty()
  @IsAvailableEnum('OAUTH_PROVIDERS')
  provider: OauthProviders;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  invitation_code?: string;
}
