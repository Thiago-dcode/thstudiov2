import {
  UserOauthProviderSchema,
  UserOauthProviderSchemaWithoutTimestamps,
} from '../schemas/user-oauth-provider';

/** Safe read model: never carries the token or its ciphertext. */
export type UserOauthProvider = Omit<UserOauthProviderSchemaWithoutTimestamps, 'refresh_token'> & {
  has_refresh_token: boolean;
};

/** Service input. `refresh_token` is PLAINTEXT (or null when the provider did not send one). */
export type UpsertUserOauthProviderInput = Pick<
  UserOauthProviderSchema,
  'user_id' | 'provider' | 'provider_user_id' | 'email' | 'scopes'
> & { refresh_token: string | null };
