import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@repo/backend-lib/services/log-service';
import { EnumType } from '@repo/common-lib/constants/enums';
import {
  UpsertUserOauthProviderInput,
  UserOauthProvider,
} from '@repo/common-lib/types/user-oauth-provider';
import { decrypt, encrypt } from '@repo/common-lib/utils/encrypt';
import { DbUniqueViolationException } from '@repo/database/exceptions';
import {
  UC_USER_OAUTH_PROVIDERS_PROVIDER_ACCOUNT,
  UserOauthProvidersRepository,
} from './user-oauth-providers.repository';

const MIN_SECRET_LENGTH = 32;

/**
 * Accounts a user has linked through an OAuth provider. Refresh tokens are encrypted here before
 * they reach the repository, and {@link getDecryptedRefreshToken} is the only way to read one back.
 * Never log or return the token, its ciphertext, the secret or the email.
 */
@Injectable()
export class UserOauthProvidersService implements OnModuleInit {
  /** Process-wide constant read once at boot; not per-request state. */
  private secret: string | null = null;

  constructor(
    private readonly repository: UserOauthProvidersRepository,
    private readonly configService: ConfigService,
    private readonly logger: LogService,
  ) { }

  /** Fail closed: the API refuses to boot without a usable `OAUTH_TOKEN_SECRET`. */
  onModuleInit() {
    const secret = this.configService.get<string>('oauth.tokenSecret');
    if (!secret || secret.length < MIN_SECRET_LENGTH) {
      throw new Error(`OAUTH_TOKEN_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
    }
    this.secret = secret;
  }

  async upsert(input: UpsertUserOauthProviderInput): Promise<UserOauthProvider> {
    const secret = this.getSecret();
    const refreshTokenReceived = Boolean(input.refresh_token);

    let linked: UserOauthProvider;
    try {
      linked = await this.repository.upsert({
        user_id: input.user_id,
        provider: input.provider,
        provider_user_id: input.provider_user_id,
        email: input.email.trim().toLowerCase(),
        scopes: input.scopes,
        encrypted_refresh_token: refreshTokenReceived
          ? encrypt(input.refresh_token as string, secret)
          : null,
      });
    } catch (error) {
      if (
        error instanceof DbUniqueViolationException &&
        error.constraintName === UC_USER_OAUTH_PROVIDERS_PROVIDER_ACCOUNT
      ) {
        throw new ConflictException('oauth_account_linked_to_another_user');
      }
      throw error;
    }

    this.logger.info('oauth provider linked', {
      user_id: input.user_id,
      provider: input.provider,
      refresh_token_received: refreshTokenReceived,
    });
    return linked;
  }

  findByUserAndProvider(
    userId: number,
    provider: EnumType<'OAUTH_PROVIDERS'>,
  ): Promise<UserOauthProvider | null> {
    return this.repository.findByUserAndProvider(userId, provider);
  }

  findByProviderUserId(
    provider: EnumType<'OAUTH_PROVIDERS'>,
    providerUserId: string,
  ): Promise<UserOauthProvider | null> {
    return this.repository.findByProviderUserId(provider, providerUserId);
  }

  listByUser(userId: number): Promise<UserOauthProvider[]> {
    return this.repository.listByUser(userId);
  }

  /**
   * Plaintext refresh token, or null when none is stored. Throws when the stored ciphertext cannot
   * be decrypted (rotated secret or corrupt data): the caller must treat that as "needs re-consent".
   */
  async getDecryptedRefreshToken(
    userId: number,
    provider: EnumType<'OAUTH_PROVIDERS'>,
  ): Promise<string | null> {
    const secret = this.getSecret();
    const ciphertext = await this.repository.findEncryptedRefreshToken(userId, provider);
    if (!ciphertext) {
      return null;
    }

    // CryptoJS can return '' rather than throw for a wrong key, so '' is a failure too.
    const plaintext = decrypt(ciphertext, secret);
    if (!plaintext) {
      this.logger.error('oauth refresh token could not be decrypted', { user_id: userId, provider });
      throw new InternalServerErrorException('oauth_refresh_token_undecryptable');
    }
    return plaintext;
  }

  private getSecret(): string {
    if (!this.secret) {
      throw new Error('UserOauthProvidersService used before onModuleInit');
    }
    return this.secret;
  }
}
