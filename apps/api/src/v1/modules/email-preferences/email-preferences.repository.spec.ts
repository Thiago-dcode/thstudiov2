// The real helper dynamic-imports `uuid`, which Jest can't run without VM modules.
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'new-token'),
}));

import { EmailPreferencesRepository } from './email-preferences.repository';

// The public contact form upserted the sender's email with the contacted artist's user_id, which
// re-pointed an existing person's row (and its token) onto that artist's account.
describe('EmailPreferencesRepository.upsertByEmail', () => {
  const setup = (existing: Record<string, unknown> | null) => {
    const repository = new EmailPreferencesRepository();
    const query = { where: jest.fn(), update: jest.fn() };
    query.where.mockReturnValue(query);
    query.update.mockResolvedValue(undefined);
    Object.assign(repository, {
      findOneByEmail: jest.fn().mockResolvedValue(existing),
      query: jest.fn(() => query),
    });
    return { repository, query };
  };

  it('never re-points a row already bound to another account', async () => {
    const { repository, query } = setup({ email: 'victim@example.test', user_id: 10, token: 't' });

    await repository.upsertByEmail({ email: 'victim@example.test', user_id: 20 });

    expect(query.update).toHaveBeenCalledWith(['email'], ['victim@example.test']);
  });

  it('binds an unbound row to the account that owns the email', async () => {
    const { repository, query } = setup({ email: 'new@example.test', user_id: null, token: 't' });

    await repository.upsertByEmail({ email: 'new@example.test', user_id: 7 });

    expect(query.update).toHaveBeenCalledWith(['email', 'user_id'], ['new@example.test', 7]);
  });
});
