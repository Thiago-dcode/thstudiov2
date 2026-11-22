import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { decrypt } from '@repo/common-lib/utils/encrypt';
import { DbUniqueViolationException } from '@repo/database/exceptions';
import { UC_USER_OAUTH_PROVIDERS_PROVIDER_ACCOUNT } from './user-oauth-providers.repository';
import { UserOauthProvidersService } from './user-oauth-providers.service';

const SECRET = 'a'.repeat(40);
/**
 * Fixed on purpose: AES-encrypt('super-secret-token-xyz', 'b' x 40). CryptoJS uses a random salt, so a
 * ciphertext built at runtime decrypts to non-empty garbage under another key in ~0.4% of runs and the
 * 500 assertion would flake. This literal was verified offline to decrypt to '' under SECRET ('a' x 40).
 */
const FOREIGN_CIPHERTEXT = 'U2FsdGVkX19SfVd+Wwax0finG1S4WjIGFLbrQRvMdE3wrI73Z50EY9mpyZqI8hrj';

const safeRow = {
  id: 1,
  user_id: 7,
  provider: 'google' as const,
  provider_user_id: 'acct-1',
  email: 'foo@example.com',
  scopes: ['openid'],
  has_refresh_token: true,
};

describe('UserOauthProvidersService', () => {
  const repository = {
    upsert: jest.fn(),
    findByUserAndProvider: jest.fn(),
    findByProviderUserId: jest.fn(),
    listByUser: jest.fn(),
    findEncryptedRefreshToken: jest.fn(),
  };
  const configService = { get: jest.fn() };
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const build = (secret: unknown = SECRET) => {
    configService.get.mockImplementation(() => {
      if (secret instanceof Error) throw secret;
      return secret;
    });
    return new UserOauthProvidersService(
      repository as never,
      configService as never,
      { log: () => logger } as never,
    );
  };

  const input = {
    user_id: 7,
    provider: 'google' as const,
    provider_user_id: 'acct-1',
    email: 'foo@example.com',
    scopes: ['openid'],
    refresh_token: 'plain-refresh-token-123',
  };

  const loggedText = () =>
    JSON.stringify([...logger.info.mock.calls, ...logger.error.mock.calls, ...logger.warn.mock.calls]);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.upsert.mockResolvedValue(safeRow);
  });

  describe('onModuleInit', () => {
    it('AC-13: throws when the secret getter throws (unset)', () => {
      const service = build(new Error('Missing required environment variable: OAUTH_TOKEN_SECRET'));
      expect(() => service.onModuleInit()).toThrow(/OAUTH_TOKEN_SECRET/);
    });

    it('AC-13: throws when the secret is empty or undefined', () => {
      expect(() => build('').onModuleInit()).toThrow(/at least 32/);
      expect(() => build(null).onModuleInit()).toThrow(/at least 32/);
    });

    it('AC-13: throws when the secret is shorter than 32 characters', () => {
      expect(() => build('a'.repeat(31)).onModuleInit()).toThrow(
        'OAUTH_TOKEN_SECRET must be at least 32 characters',
      );
    });

    it('AC-13: accepts exactly 32 characters', () => {
      expect(() => build('a'.repeat(32)).onModuleInit()).not.toThrow();
    });

    it('AC-13: encrypting/decrypting before init fails closed', async () => {
      const service = build();
      await expect(service.upsert(input)).rejects.toThrow(/before onModuleInit/);
      await expect(service.getDecryptedRefreshToken(7, 'google')).rejects.toThrow(/before onModuleInit/);
      expect(repository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('upsert', () => {
    let service: UserOauthProvidersService;
    beforeEach(() => {
      service = build();
      service.onModuleInit();
    });

    it('AC-9: passes an encrypted token that differs from the plaintext and decrypts back', async () => {
      await service.upsert(input);
      const record = repository.upsert.mock.calls[0][0];
      expect(record.encrypted_refresh_token.startsWith('U2FsdGVkX1')).toBe(true);
      expect(record.encrypted_refresh_token).not.toBe(input.refresh_token);
      expect(decrypt(record.encrypted_refresh_token, SECRET)).toBe(input.refresh_token);
      expect(record).not.toHaveProperty('refresh_token');
    });

    it('AC-9: null and empty tokens are passed as null', async () => {
      await service.upsert({ ...input, refresh_token: null });
      await service.upsert({ ...input, refresh_token: '' });
      expect(repository.upsert.mock.calls[0][0].encrypted_refresh_token).toBeNull();
      expect(repository.upsert.mock.calls[1][0].encrypted_refresh_token).toBeNull();
    });

    it('AC-12: stores the email trimmed and lowercased', async () => {
      await service.upsert({ ...input, email: '  Foo@Example.COM ' });
      expect(repository.upsert.mock.calls[0][0].email).toBe('foo@example.com');
    });

    it('AC-8: maps a provider-account clash to ConflictException', async () => {
      repository.upsert.mockRejectedValue(
        new DbUniqueViolationException('dup', UC_USER_OAUTH_PROVIDERS_PROVIDER_ACCOUNT),
      );
      const error = await service.upsert(input).catch((e) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.message).toBe('oauth_account_linked_to_another_user');
    });

    it('AC-8: other unique violations and errors propagate unchanged', async () => {
      const other = new DbUniqueViolationException('dup', 'some_other_constraint');
      repository.upsert.mockRejectedValueOnce(other);
      await expect(service.upsert(input)).rejects.toBe(other);

      const boom = new Error('boom');
      repository.upsert.mockRejectedValueOnce(boom);
      await expect(service.upsert(input)).rejects.toBe(boom);
    });

    it('AC-10: logs no token, ciphertext, secret or email on upsert', async () => {
      await service.upsert(input);
      const ciphertext = repository.upsert.mock.calls[0][0].encrypted_refresh_token;
      expect(logger.info).toHaveBeenCalledWith('oauth provider linked', {
        user_id: 7,
        provider: 'google',
        refresh_token_received: true,
      });
      const text = loggedText();
      expect(text).not.toContain(input.refresh_token);
      expect(text).not.toContain(ciphertext);
      expect(text).not.toContain(SECRET);
      expect(text).not.toContain(input.email);
    });

    it('AC-11: returns the read model without refresh_token', async () => {
      const result = await service.upsert(input);
      expect(result).not.toHaveProperty('refresh_token');
      expect(typeof result.has_refresh_token).toBe('boolean');
    });
  });

  describe('finders', () => {
    let service: UserOauthProvidersService;
    beforeEach(() => {
      service = build();
      service.onModuleInit();
    });

    it('AC-11: delegate to the repository and return values without token keys', async () => {
      repository.findByUserAndProvider.mockResolvedValue(safeRow);
      repository.findByProviderUserId.mockResolvedValue(safeRow);
      repository.listByUser.mockResolvedValue([safeRow]);

      const a = await service.findByUserAndProvider(7, 'google');
      const b = await service.findByProviderUserId('google', 'acct-1');
      const c = await service.listByUser(7);

      expect(repository.findByUserAndProvider).toHaveBeenCalledWith(7, 'google');
      expect(repository.findByProviderUserId).toHaveBeenCalledWith('google', 'acct-1');
      expect(repository.listByUser).toHaveBeenCalledWith(7);
      for (const row of [a, b, ...c]) {
        expect(row).not.toHaveProperty('refresh_token');
        expect(typeof row?.has_refresh_token).toBe('boolean');
      }
    });

    it('AC-11: the public surface is exactly the planned methods', () => {
      const methods = Object.getOwnPropertyNames(UserOauthProvidersService.prototype)
        .filter((m) => m !== 'constructor' && m !== 'getSecret')
        .sort();
      expect(methods).toEqual(
        [
          'findByProviderUserId',
          'findByUserAndProvider',
          'getDecryptedRefreshToken',
          'listByUser',
          'onModuleInit',
          'upsert',
        ].sort(),
      );
    });
  });

  describe('getDecryptedRefreshToken', () => {
    let service: UserOauthProvidersService;
    beforeEach(() => {
      service = build();
      service.onModuleInit();
    });

    it('AC-10: returns the plaintext after an upsert with a token', async () => {
      await service.upsert(input);
      const stored = repository.upsert.mock.calls[0][0].encrypted_refresh_token;
      repository.findEncryptedRefreshToken.mockResolvedValue(stored);
      await expect(service.getDecryptedRefreshToken(7, 'google')).resolves.toBe(input.refresh_token);
      expect(repository.findEncryptedRefreshToken).toHaveBeenCalledWith(7, 'google');
    });

    it('AC-10: returns null with no row or no stored token', async () => {
      repository.findEncryptedRefreshToken.mockResolvedValueOnce(null);
      await expect(service.getDecryptedRefreshToken(7, 'google')).resolves.toBeNull();
      repository.findEncryptedRefreshToken.mockResolvedValueOnce('');
      await expect(service.getDecryptedRefreshToken(7, 'google')).resolves.toBeNull();
    });

    it('AC-10: throws a generic 500 for ciphertext made with another secret, leaking nothing', async () => {
      const foreign = FOREIGN_CIPHERTEXT;
      expect(decrypt(foreign, SECRET)).toBeFalsy();
      repository.findEncryptedRefreshToken.mockResolvedValue(foreign);

      const error = await service.getDecryptedRefreshToken(7, 'google').catch((e) => e);
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error.message).toBe('oauth_refresh_token_undecryptable');
      expect(error.message).not.toContain(foreign);
      expect(error.message).not.toContain('super-secret-token-xyz');

      expect(logger.error).toHaveBeenCalledWith('oauth refresh token could not be decrypted', {
        user_id: 7,
        provider: 'google',
      });
      const text = loggedText();
      expect(text).not.toContain(foreign);
      expect(text).not.toContain('super-secret-token-xyz');
      expect(text).not.toContain(SECRET);
    });

    it('AC-10: throws for corrupt (non-OpenSSL) ciphertext without logging it', async () => {
      repository.findEncryptedRefreshToken.mockResolvedValue('not-a-ciphertext');
      await expect(service.getDecryptedRefreshToken(7, 'google')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(loggedText()).not.toContain('not-a-ciphertext');
    });
  });
});
