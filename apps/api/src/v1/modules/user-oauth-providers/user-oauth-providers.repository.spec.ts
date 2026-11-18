import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DbException } from '@repo/database/exceptions';
import { Query } from '@repo/database/facades';
import { UserOauthProvidersRepository } from './user-oauth-providers.repository';

jest.mock('@repo/database/facades', () => ({
  Query: {
    table: jest.fn(),
    raw: jest.fn(),
  },
}));

/** Collapse whitespace so assertions don't depend on SQL indentation. */
const sql = (query: string) => query.replace(/\s+/g, ' ').trim();

const TABLE = TABLES_ENUM.USER_OAUTH_PROVIDERS;
const SAFE_FLAG = '(refresh_token IS NOT NULL) AS has_refresh_token';

const row = {
  id: 1,
  user_id: 7,
  provider: 'google',
  provider_user_id: 'acct-1',
  email: 'foo@example.com',
  scopes: ['openid', 'email'],
  has_refresh_token: true,
};

/** True when the bare `refresh_token` column appears outside the IS NOT NULL flag. */
const mentionsBareToken = (text: string) => text.replace(SAFE_FLAG, '').includes('refresh_token');

describe('UserOauthProvidersRepository', () => {
  let repository: UserOauthProvidersRepository;
  let chain: {
    rawSelect: jest.Mock;
    select: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    first: jest.Mock;
    get: jest.Mock;
  };

  const record = {
    user_id: 7,
    provider: 'google' as const,
    provider_user_id: 'acct-1',
    email: 'foo@example.com',
    scopes: ['openid', 'email'],
    encrypted_refresh_token: 'U2FsdGVkX1abc',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    chain = {
      rawSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      first: jest.fn(),
      get: jest.fn(),
    };
    repository = new UserOauthProvidersRepository();
    // The query builder is the DB boundary: replace it, not the repository.
    jest.spyOn(repository as never, 'query').mockReturnValue(chain as never);
    (Query.raw as jest.Mock).mockResolvedValue({ rows: [{ ...row, scopes: '["openid","email"]' }] });
  });

  describe('upsert', () => {
    it('AC-5: is a single ON CONFLICT (user_id, provider) statement with jsonb scopes and updated_at', async () => {
      await repository.upsert(record);

      expect(Query.raw).toHaveBeenCalledTimes(1);
      const [query, values] = (Query.raw as jest.Mock).mock.calls[0] as [string, unknown[]];
      const text = sql(query);
      expect(text).toContain(`INSERT INTO ${TABLE}`);
      expect(text).toContain('VALUES ($1, $2, $3, $4, $5::jsonb, $6)');
      expect(text).toContain('ON CONFLICT (user_id, provider) DO UPDATE SET');
      expect(text).toContain('email = EXCLUDED.email');
      expect(text).toContain('scopes = EXCLUDED.scopes');
      expect(text).toContain('updated_at = NOW()');
      expect(values).toEqual([
        7,
        'google',
        'acct-1',
        'foo@example.com',
        JSON.stringify(['openid', 'email']),
        'U2FsdGVkX1abc',
      ]);
    });

    it('AC-6/AC-7: keeps the token only for the same provider account, via CASE + COALESCE', async () => {
      await repository.upsert(record);
      const text = sql((Query.raw as jest.Mock).mock.calls[0][0]);
      expect(text).toContain(
        `refresh_token = CASE WHEN ${TABLE}.provider_user_id = EXCLUDED.provider_user_id ` +
          `THEN COALESCE(EXCLUDED.refresh_token, ${TABLE}.refresh_token) ` +
          `ELSE EXCLUDED.refresh_token END`,
      );
    });

    it('AC-6: binds a null ciphertext as null', async () => {
      await repository.upsert({ ...record, encrypted_refresh_token: null });
      expect((Query.raw as jest.Mock).mock.calls[0][1][5]).toBeNull();
    });

    it('AC-11: RETURNING uses the safe list and never the bare refresh_token column', async () => {
      await repository.upsert(record);
      const text = sql((Query.raw as jest.Mock).mock.calls[0][0]);
      const returning = text.slice(text.indexOf('RETURNING'));
      expect(returning).toContain(SAFE_FLAG);
      expect(mentionsBareToken(returning)).toBe(false);
    });

    it('AC-11: result has no refresh_token key, parses string scopes, boolean flag', async () => {
      const result = await repository.upsert(record);
      expect(result).not.toHaveProperty('refresh_token');
      expect(result.scopes).toEqual(['openid', 'email']);
      expect(result.has_refresh_token).toBe(true);
    });

    it('accepts the array result shape too', async () => {
      (Query.raw as jest.Mock).mockResolvedValue([[row]]);
      await expect(repository.upsert(record)).resolves.toMatchObject({ id: 1 });
    });

    it('throws DbException when no row is returned', async () => {
      (Query.raw as jest.Mock).mockResolvedValue({ rows: [] });
      await expect(repository.upsert(record)).rejects.toThrow(DbException);
    });

    it('AC-8: does not swallow a unique violation (the service maps it)', async () => {
      const err = new Error('dup');
      (Query.raw as jest.Mock).mockRejectedValue(err);
      await expect(repository.upsert(record)).rejects.toBe(err);
    });
  });

  describe('reads', () => {
    const rawSelected = () => chain.rawSelect.mock.calls.map((c) => c[0]).join(' ');

    it('AC-11: findByUserAndProvider uses the safe list and strips token keys', async () => {
      chain.first.mockResolvedValue({ ...row, refresh_token: 'LEAK' });
      const result = await repository.findByUserAndProvider(7, 'google');
      expect(rawSelected()).toContain(SAFE_FLAG);
      expect(mentionsBareToken(rawSelected())).toBe(false);
      expect(chain.select).not.toHaveBeenCalled();
      expect(chain.where).toHaveBeenCalledWith('user_id', '=', 7);
      expect(chain.where).toHaveBeenCalledWith('provider', '=', 'google');
      expect(result).not.toHaveProperty('refresh_token');
      expect(result?.has_refresh_token).toBe(true);
    });

    it('AC-11: findByProviderUserId filters by provider account and returns null when missing', async () => {
      chain.first.mockResolvedValueOnce(null);
      await expect(repository.findByProviderUserId('google', 'nope')).resolves.toBeNull();
      expect(chain.where).toHaveBeenCalledWith('provider', '=', 'google');
      expect(chain.where).toHaveBeenCalledWith('provider_user_id', '=', 'nope');
      expect(chain.select).not.toHaveBeenCalled();
      expect(mentionsBareToken(rawSelected())).toBe(false);
    });

    it('AC-11: listByUser orders by provider, id and formats every row', async () => {
      chain.get.mockResolvedValue([
        { ...row, has_refresh_token: 1, refresh_token: 'LEAK' },
        { ...row, id: 2, has_refresh_token: null },
      ]);
      const result = await repository.listByUser(7);
      expect(chain.orderBy).toHaveBeenNthCalledWith(1, 'provider', 'ASC');
      expect(chain.orderBy).toHaveBeenNthCalledWith(2, 'id', 'ASC');
      expect(mentionsBareToken(rawSelected())).toBe(false);
      expect(result).toHaveLength(2);
      for (const r of result) {
        expect(r).not.toHaveProperty('refresh_token');
        expect(typeof r.has_refresh_token).toBe('boolean');
      }
      expect(result[1].has_refresh_token).toBe(false);
    });

    it('AC-11: only findEncryptedRefreshToken selects the refresh_token column', async () => {
      chain.first.mockResolvedValue({ refresh_token: 'U2FsdGVkX1abc' });
      await expect(repository.findEncryptedRefreshToken(7, 'google')).resolves.toBe('U2FsdGVkX1abc');
      expect(chain.select).toHaveBeenCalledWith(['refresh_token']);

      chain.first.mockResolvedValue(null);
      await expect(repository.findEncryptedRefreshToken(7, 'google')).resolves.toBeNull();
      chain.first.mockResolvedValue({ refresh_token: null });
      await expect(repository.findEncryptedRefreshToken(7, 'google')).resolves.toBeNull();
    });
  });
});
