jest.mock('@repo/database/facades', () => ({
  Query: { table: jest.fn(), raw: jest.fn() },
}));

import { Query } from '@repo/database/facades';
import { UserRepository } from './users.repository';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { CollectionRepository } from '../collections/collection.repository';
import { ServiceRepository } from '../services/service.repository';

const PROFILE_ROW = {
  id: 42,
  name: 'Ada',
  surname: 'Lovelace',
  username: 'ada',
  avatar: null,
  banner: null,
  is_active: true,
  short_biography: null,
  biography: null,
  profession: 'Photographer',
  is_featured: false,
  a_id: 1,
  city: 'Lisbon',
  state: 'Lisbon',
};

describe('UserRepository profile sections (counts + about flag)', () => {
  const raw = Query.raw as jest.Mock;
  let repository: UserRepository;

  beforeEach(() => {
    raw.mockReset();
    repository = new UserRepository({ language: 'en' } as never);
    // Stub the profile select: the chain returns itself and `.get()` resolves one row.
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'where', 'join']) chain[m] = jest.fn(() => chain);
    chain.get = jest.fn().mockResolvedValue([PROFILE_ROW]);
    (repository as unknown as { query: () => unknown }).query = () => chain;
  });

  const rawRow = (row: Record<string, unknown>) => raw.mockResolvedValue({ rows: [row] });

  it.each(['getUserProfile', 'getUserProfileById'] as const)(
    'AC-8: %s makes exactly one Query.raw bound to [id] using the LISTED predicates',
    async (method) => {
      rawRow({ has_public_portfolio: true });
      await repository[method](method === 'getUserProfile' ? 'ada' : 42);

      expect(raw).toHaveBeenCalledTimes(1);
      const [sql, bindings] = raw.mock.calls[0];
      expect(bindings).toEqual([42]);
      expect(sql).toContain(PortfolioRepository.LISTED_PORTFOLIO_PREDICATE);
      expect(sql).toContain(CollectionRepository.LISTED_COLLECTION_PREDICATE);
      expect(sql).toContain(ServiceRepository.LISTED_SERVICE_PREDICATE);
      expect(sql).toContain('about_page');
      expect(sql).not.toContain(PortfolioRepository.PUBLIC_PORTFOLIO_PREDICATE);
      expect(sql).not.toContain(CollectionRepository.PUBLIC_COLLECTION_PREDICATE);
      expect(sql).not.toContain(ServiceRepository.PUBLIC_SERVICE_PREDICATE);
      expect(sql).toContain('AS portfolios_active_count');
      expect(sql).toContain('AS collections_active_count');
      expect(sql).toContain('AS services_active_count');
      expect(sql).toContain('AS has_about_page');
    },
  );

  it('AC-1: maps snake_case raw columns to the response keys and keeps existing fields', async () => {
    rawRow({
      has_public_portfolio: true,
      portfolios_active_count: 2,
      collections_active_count: 0,
      services_active_count: 1,
      has_about_page: false,
    });
    const profile = await repository.getUserProfile('ada');

    expect(profile).toMatchObject({
      id: 42,
      username: 'ada',
      is_share_ready: true,
      portfoliosActiveCount: 2,
      collectionsActiveCount: 0,
      servicesActiveCount: 1,
      has_about_page: false,
    });
    expect(profile).not.toHaveProperty('portfolios_active_count');
    expect(profile).not.toHaveProperty('has_public_portfolio');
  });

  it('AC-9: driver strings become numbers and "t" becomes true', async () => {
    rawRow({
      has_public_portfolio: true,
      portfolios_active_count: '3',
      collections_active_count: 0,
      services_active_count: null,
      has_about_page: 't',
    });
    const profile = await repository.getUserProfileById(42);

    expect(profile).toMatchObject({
      portfoliosActiveCount: 3,
      collectionsActiveCount: 0,
      servicesActiveCount: 0,
      has_about_page: true,
    });
    expect(typeof profile!.portfoliosActiveCount).toBe('number');
  });

  it('AC-9: boolean true and the string "true" are true, "f" and false are false', async () => {
    for (const [input, expected] of [[true, true], ['true', true], ['f', false], [false, false]] as const) {
      rawRow({ has_about_page: input });
      const profile = await repository.getUserProfile('ada');
      expect(profile!.has_about_page).toBe(expected);
    }
  });

  it('AC-9: an empty raw result gives 0 / 0 / 0 / false, never NaN or undefined', async () => {
    raw.mockResolvedValue({ rows: [] });
    const profile = await repository.getUserProfile('ada');

    expect(profile).toMatchObject({
      portfoliosActiveCount: 0,
      collectionsActiveCount: 0,
      servicesActiveCount: 0,
      has_about_page: false,
      is_share_ready: false,
    });
  });

  it('AC-9: a non-numeric count becomes 0, not NaN', async () => {
    rawRow({ portfolios_active_count: 'abc', collections_active_count: undefined, services_active_count: NaN });
    const profile = await repository.getUserProfile('ada');

    expect(profile!.portfoliosActiveCount).toBe(0);
    expect(profile!.collectionsActiveCount).toBe(0);
    expect(profile!.servicesActiveCount).toBe(0);
  });
});
