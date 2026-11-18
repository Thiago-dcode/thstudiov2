import { Injectable } from '@nestjs/common';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import {
  UpsertUserOauthProviderInput,
  UserOauthProvider,
} from '@repo/common-lib/types/user-oauth-provider';
import { UserOauthProviderSchemaWithoutTimestamps } from '@repo/common-lib/schemas/user-oauth-provider';
import { DbException } from '@repo/database/exceptions';
import { Query } from '@repo/database/facades';
import { BaseRepository } from '@repo/database/repositories';

/** Unique `(provider, provider_user_id)`: one provider account can be linked to one user only. */
export const UC_USER_OAUTH_PROVIDERS_PROVIDER_ACCOUNT = 'uc_user_oauth_providers_provider_account';

/** Repository input: the token is already encrypted by the service. */
export type UpsertUserOauthProviderRecord = Omit<UpsertUserOauthProviderInput, 'refresh_token'> & {
  encrypted_refresh_token: string | null;
};

type SafeRow = Omit<UserOauthProviderSchemaWithoutTimestamps, 'refresh_token' | 'scopes'> & {
  scopes: string[] | string;
  has_refresh_token: boolean;
};

/**
 * Every SELECT and RETURNING uses this list, so the ciphertext never leaves the repository except
 * through {@link UserOauthProvidersRepository.findEncryptedRefreshToken}.
 */
const SAFE_COLUMNS =
  'id, user_id, provider, provider_user_id, email, scopes, (refresh_token IS NOT NULL) AS has_refresh_token';

@Injectable()
export class UserOauthProvidersRepository extends BaseRepository {
  constructor() {
    super(TABLES_ENUM.USER_OAUTH_PROVIDERS);
  }

  /**
   * Links (or re-links) the user's account for a provider, keyed by `(user_id, provider)`.
   *
   * The refresh token is kept when the callback did not send one (Google only sends it on first
   * consent), but only while it is the same provider account: re-linking a different account must
   * not leave the old account's token under the new account's id.
   *
   * A clash on `(provider, provider_user_id)` is not handled by `ON CONFLICT` and surfaces as
   * `DbUniqueViolationException`; the service maps it.
   */
  async upsert(record: UpsertUserOauthProviderRecord): Promise<UserOauthProvider> {
    const table = TABLES_ENUM.USER_OAUTH_PROVIDERS;
    const result = await Query.raw(
      `INSERT INTO ${table} (user_id, provider, provider_user_id, email, scopes, refresh_token)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         provider_user_id = EXCLUDED.provider_user_id,
         email = EXCLUDED.email,
         scopes = EXCLUDED.scopes,
         refresh_token = CASE
           WHEN ${table}.provider_user_id = EXCLUDED.provider_user_id
             THEN COALESCE(EXCLUDED.refresh_token, ${table}.refresh_token)
           ELSE EXCLUDED.refresh_token
         END,
         updated_at = NOW()
       RETURNING ${SAFE_COLUMNS};`,
      [
        record.user_id,
        record.provider,
        record.provider_user_id,
        record.email,
        JSON.stringify(record.scopes),
        record.encrypted_refresh_token,
      ],
    );

    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    if (!rows?.[0]) {
      throw new DbException('Could not upsert user oauth provider');
    }
    return this.format(rows[0] as SafeRow);
  }

  async findByUserAndProvider(
    userId: number,
    provider: EnumType<'OAUTH_PROVIDERS'>,
  ): Promise<UserOauthProvider | null> {
    const row = await this.query()
      .rawSelect(SAFE_COLUMNS)
      .where('user_id', '=', userId)
      .where('provider', '=', provider)
      .first<SafeRow>();

    return row ? this.format(row) : null;
  }

  async findByProviderUserId(
    provider: EnumType<'OAUTH_PROVIDERS'>,
    providerUserId: string,
  ): Promise<UserOauthProvider | null> {
    const row = await this.query()
      .rawSelect(SAFE_COLUMNS)
      .where('provider', '=', provider)
      .where('provider_user_id', '=', providerUserId)
      .first<SafeRow>();

    return row ? this.format(row) : null;
  }

  async listByUser(userId: number): Promise<UserOauthProvider[]> {
    const rows = await this.query()
      .rawSelect(SAFE_COLUMNS)
      .where('user_id', '=', userId)
      .orderBy('provider', 'ASC')
      .orderBy('id', 'ASC')
      .get<SafeRow[]>();

    return (rows ?? []).map((row) => this.format(row));
  }

  /** Ciphertext only; callers outside UserOauthProvidersService must not use this. */
  async findEncryptedRefreshToken(
    userId: number,
    provider: EnumType<'OAUTH_PROVIDERS'>,
  ): Promise<string | null> {
    const row = await this.query()
      .select(['refresh_token'])
      .where('user_id', '=', userId)
      .where('provider', '=', provider)
      .first<{ refresh_token: string | null }>();

    return row?.refresh_token ?? null;
  }

  private format(row: SafeRow): UserOauthProvider {
    return {
      id: row.id,
      user_id: row.user_id,
      provider: row.provider,
      provider_user_id: row.provider_user_id,
      email: row.email,
      scopes: typeof row.scopes === 'string' ? (JSON.parse(row.scopes) as string[]) : row.scopes,
      has_refresh_token: Boolean(row.has_refresh_token),
    };
  }
}
