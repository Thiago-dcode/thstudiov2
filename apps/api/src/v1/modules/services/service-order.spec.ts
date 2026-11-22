jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import { ServiceRepository } from './service.repository';

type Call = [method: string, ...args: unknown[]];

/** A chainable stand-in for QueryBuilder that records every call in order. */
const recorder = () => {
  const calls: Call[] = [];
  const query: any = new Proxy(
    {},
    {
      get: (_t, method: string) => {
        if (method === 'then') return undefined;
        return (...args: unknown[]) => {
          calls.push([method, ...args]);
          return method === 'count' ? Promise.resolve(10) : query;
        };
      },
    },
  );
  return { query, calls };
};

const orderBys = (calls: Call[]) =>
  calls.filter(([m]) => m === 'orderBy').map(([, col, dir]) => `${col} ${dir}`);

const buildRepo = () => {
  const requestService = { pagination: undefined } as any;
  const repository = new ServiceRepository(requestService);
  const applyFilters = async (filters: Record<string, unknown>) => {
    const { query, calls } = recorder();
    await (repository as any).applyFilters(filters, query);
    return { calls, order: orderBys(calls) };
  };
  return { repository, applyFilters };
};

describe('ServiceRepository ordering', () => {
  it('AC-8: a single-artist unpaged list orders by services.position, created_at DESC, services.id DESC', async () => {
    const { applyFilters } = buildRepo();
    const { order } = await applyFilters({ user_id: 5 });
    expect(order).toEqual(['services.position ASC', 'created_at DESC', 'services.id DESC']);
  });

  it('AC-8: a single-artist paged list has position before the pagination id DESC', async () => {
    const { applyFilters } = buildRepo();
    const { order } = await applyFilters({
      user_id: 5,
      paginated: true,
      per_page: 5,
      is_highlight: true,
      is_active: true,
      blocked: false,
    });
    expect(order[0]).toBe('services.position ASC');
    const posIdx = order.indexOf('services.position ASC');
    const idIdx = order.findIndex((o) => o === 'id DESC');
    expect(idIdx).toBeGreaterThan(posIdx);
    expect(order).toEqual([
      'services.position ASC',
      'id DESC',
      'created_at DESC',
      'services.id DESC',
    ]);
  });

  it('AC-8: without user_id the ORDER BY is exactly today\'s (unpaged and paged)', async () => {
    const { applyFilters } = buildRepo();
    const unpaged = await applyFilters({});
    expect(unpaged.order).toEqual(['created_at DESC']);

    const paged = await applyFilters({ paginated: true, per_page: 10 });
    expect(paged.order).toEqual(['id DESC', 'created_at DESC']);
    expect(paged.order.some((o) => o.includes('position'))).toBe(false);
  });

  it('AC-8: filters other than user_id never enable position order', async () => {
    const { applyFilters } = buildRepo();
    const { order } = await applyFilters({ is_highlight: true, is_active: true });
    expect(order).toEqual(['created_at DESC']);
  });
});

describe('ServiceRepository columns and formatting', () => {
  it('AC-9: services.position is selected, portfolios.position never unaliased', () => {
    const { repository } = buildRepo();
    for (const key of ['COLUMNS', 'FULL_COLUMNS']) {
      const cols: string[] = (repository as any)[key];
      expect(cols).toContain('services.position');
      expect(cols).not.toContain('portfolios.position');
      expect(cols.filter((c) => /(^|\.)position$/.test(c))).toEqual(['services.position']);
    }
  });

  it('AC-9: every joined FULL_COLUMNS entry is aliased', () => {
    const { repository } = buildRepo();
    const joined = ((repository as any).FULL_COLUMNS as string[]).filter(
      (c) => !c.startsWith('services.'),
    );
    expect(joined.length).toBeGreaterThan(0);
    for (const c of joined) expect(c).toMatch(/ as (sf|st|p)_\w+$/);
  });

  const row = (over: Record<string, unknown> = {}) => ({
    id: 1,
    title: 'Portrait',
    slug: 'portrait',
    description: null,
    thumbnail: null,
    price: null,
    is_active: true,
    is_featured: false,
    is_highlight: false,
    is_indexable: true,
    show_price: false,
    seo_title: null,
    seo_description: null,
    seo_generated_at: null,
    user_id: 5,
    portfolio_id: null,
    blocked_at: null,
    position: 4,
    created_at: 'c',
    updated_at: 'u',
    ...over,
  });

  it('AC-9: the list/compact formatter maps position', async () => {
    const { repository } = buildRepo();
    const { query } = recorder();
    jest.spyOn(repository as any, 'query').mockReturnValue(query);
    jest.spyOn(repository as any, 'applyFilters').mockResolvedValue({
      get: async () => [row({ id: 1, position: 3 }), row({ id: 2, position: 8 })],
    });
    const list = await repository.getAll({} as never);
    expect(list.map((s: any) => s.position)).toEqual([3, 8]);
  });

  it('AC-9: the full formatter maps services.position (not the joined portfolio) and keeps portfolio fields', () => {
    const { repository } = buildRepo();
    const full = (repository as any).formatFullService([
      row({
        position: 3,
        sf_id: 1,
        sf_title: 'f1',
        st_id: 1,
        st_title: 't1',
        p_id: 9,
        p_slug: 'p',
        p_title: 'P',
        p_is_featured: true,
        p_is_highlight: false,
      }),
      row({ position: 3, sf_id: 2, sf_title: 'f2', st_id: 1, st_title: 't1', p_id: 9 }),
    ]);
    expect(full.position).toBe(3);
    expect(full.features).toEqual([
      { id: 1, title: 'f1' },
      { id: 2, title: 'f2' },
    ]);
    expect(full.terms).toEqual([{ id: 1, title: 't1' }]);
    expect(full.portfolio).toEqual({ id: 9, slug: 'p', title: 'P', is_featured: true, is_highlight: false });
  });
});

describe('ServiceRepository writes', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-6: updatePositions delegates to the owner-scoped helper and keeps a fresh SEO stamp', async () => {
    const { repository } = buildRepo();
    const spy = jest.spyOn(repository as any, 'updatePositionsForOwner').mockResolvedValue(2);
    const items = [{ module_id: 1, position: 0 }];
    await expect(repository.updatePositions(9, items)).resolves.toBe(2);
    expect(spy).toHaveBeenCalledWith(9, items, { seoStampColumn: 'seo_generated_at' });
  });

  it('AC-11/AC-15: updateStatus delegates to the owner-scoped helper and keeps a fresh SEO stamp', async () => {
    const { repository } = buildRepo();
    const result = { id: 5, is_highlight: true, is_active: true };
    const spy = jest.spyOn(repository as any, 'updateStatusForOwner').mockResolvedValue(result);
    await expect(repository.updateStatus(5, 9, { is_highlight: true })).resolves.toEqual(result);
    expect(spy).toHaveBeenCalledWith(5, 9, { is_highlight: true }, { seoStampColumn: 'seo_generated_at' });
  });

  it('AC-6: the public predicate and its SQL are unchanged (one predicate per entity)', () => {
    expect(ServiceRepository.PUBLIC_SERVICE_PREDICATE).toContain('s.blocked_at IS NULL');
    expect(ServiceRepository.PUBLIC_SERVICE_PREDICATE).toContain('s.is_active = true');
    expect(ServiceRepository.PUBLIC_SERVICE_PREDICATE).toContain('s.is_indexable = true');
    expect(ServiceRepository.PUBLIC_SERVICE_PREDICATE).not.toContain('position');
  });
});
