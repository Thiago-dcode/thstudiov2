import type { GoogleAuthInitiate, OauthProviders } from '@repo/common-lib/types/auth';
import { IsNotEmpty, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { config } from '@repo/common-lib/config';
import { IsValidOrigin } from 'src/common/decorators/is-valid-origin';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';


export class Oauth2InitiateRequest implements GoogleAuthInitiate {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  @IsValidOrigin(config().app.allowedOrigins)
  redirect_uri: string;
  @IsString()
  @IsNotEmpty()
  @IsAvailableEnum('OAUTH_PROVIDERS')
  provider: OauthProviders;
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  state: string;
  // PKCE S256 challenge (RFC 7636): base64url, no padding.
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43,128}$/)
  code_challenge: string;
}
