import { GOOGLE_SCOPES } from "../constants/auth";
import { ENUMS } from "../constants/enums";
import { PasswordRecoveryAttemptSchema } from "../schemas/password-recovery-attempt";
import { BaseUser } from "./user";
import { UserAuthDevice } from "./user-session";

export type UserAuth = BaseUser & {
  need_twofa?: false,
  token: string
};
export type UserTwofa = BaseUser & {
  need_twofa: true,
  token: null;
}
export type UserPayload = BaseUser & {
  user_auth_device_id?: number;
};

export type TwoFactorAuth = {
  user_auth_device: UserAuthDevice;
  user: BaseUser;
  need_2fa: boolean;
};
export type PasswordRecoveryAttempt = PasswordRecoveryAttemptSchema;



export type OauthProviders = (typeof ENUMS.OAUTH_PROVIDERS)[number];

export interface GoogleAuthInitiate {
  redirect_uri: string,
  provider: OauthProviders,
  /** Random per-attempt value; the web keeps a copy in a cookie and compares it on the callback. */
  state: string,
  /** PKCE S256 challenge of the verifier the web keeps in that same cookie. */
  code_challenge: string
}

export interface OauthCallback {
  code: string,
  /** The same `redirect_uri` the authorization URL was built with: the code exchange needs it. */
  redirect_uri: string,
  /** PKCE verifier behind the initiate step's `code_challenge`: a leaked code alone is useless. */
  code_verifier: string,
  provider: OauthProviders,
  invitation_code?: string
}

/** `POST auth/oauth2/callback`: always a signed-in session (no 2FA step after a provider). */
export type OauthCallbackResponse = {
  auth: UserAuth;
  /** `false` when this callback created the account. */
  alreadyExist: boolean;
};


export type GoogleScope = (typeof GOOGLE_SCOPES)[number];