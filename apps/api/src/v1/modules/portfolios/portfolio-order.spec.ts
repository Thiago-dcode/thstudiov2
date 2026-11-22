jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import { PortfolioRepository } from './portfolio.repository';

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
          return method === 'count' ? Promise.resolve(0) : query;
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
  const repository = new PortfolioRepository(requestService);
  const applyFilters = (filters: Record<string, unknown>) => {
    const { query, calls } = recorder();
    return (repository as any)
      .applyFilters(filters, query, {})
      .then(() => ({ calls, order: orderBys(calls), requestService }));
  };
  return { repository, applyFilters };
};

describe('PortfolioRepository ordering (AC-9)', () => {
  it('AC-9: a single-artist paged list orders by portfolios.position before the id DESC pagination order', async () => {
    const { applyFilters } = buildRepo();
    const { order } = await applyFilters({
      user_id: 5,
      paginated: true,
      per_page: 5,
      is_highlight: true,
    });
    expect(order[0]).toBe('portfolios.position ASC');
    const posIdx = order.indexOf('portfolios.position ASC');
    const idIdx = order.findIndex((o) => /\bid DESC$/.test(o));
    expect(idIdx).toBeGreaterThan(posIdx);
    // The created_at/id tie-break stays last.
    expect(order.slice(-2)).toEqual(['portfolios.created_at DESC', 'portfolios.id DESC']);
  });

  it('AC-1/AC-9: a single-artist unpaged list (atelier) orders by position then created_at DESC, id DESC', async () => {
    const { applyFilters } = buildRepo();
    const { order } = await applyFilters({ user_id: 5 });
    expect(order).toEqual(['portfolios.position ASC', 'portfolios.created_at DESC', 'portfolios.id DESC']);
  });

  it('AC-9: a cross-artist list (no user_id) never orders by position', async () => {
    const { applyFilters } = buildRepo();
    const unpaged = await applyFilters({});
    expect(unpaged.order).toEqual(['portfolios.created_at DESC', 'portfolios.id DESC']);

    const paged = await applyFilters({ paginated: true, per_page: 10 });
    expect(paged.order.some((o) => o.includes('position'))).toBe(false);
    expect(paged.order.slice(-2)).toEqual(['portfolios.created_at DESC', 'portfolios.id DESC']);
  });

  it('AC-9: with a distance filter the position order still comes after orderByDistance (which replaces the order string)', async () => {
    const { applyFilters } = buildRepo();
    const { calls } = await applyFilters({ user_id: 5, lat: 1, lng: 2 });
    const names = calls.map(([m]) => m);
    const distance = names.indexOf('orderByDistance');
    const position = calls.findIndex(([m, col]) => m === 'orderBy' && col === 'portfolios.position');
    expect(distance).toBeGreaterThanOrEqual(0);
    expect(position).toBeGreaterThan(distance);
  });
});

describe('PortfolioRepository formatting (AC-10)', () => {
  const row = (over: Record<string, unknown>) => ({
    id: 1,
    slug: 'work',
    title: 'Work',
    thumbnail: null,
    description: null,
    is_featured: false,
    is_highlight: false,
    is_active: true,
    is_indexable: true,
    position: 3,
    seo_title: null,
    seo_description: null,
    seo_generated_at: null,
    blocked_at: null,
    user_id: 5,
    created_at: 'c',
    updated_at: 'u',
    u_id: 5,
    username: 'artist',
    name: 'A',
    surname: 'B',
    ...over,
  });

  it('AC-10: the portfolio keeps portfolios.position and each media keeps portfolio_media.position (pm_position)', () => {
    const { repository } = buildRepo();
    const full = (repository as any).formatFullPortfolio([
      row({ m_id: 10, public_id: 'a', pm_position: 0 }),
      row({ m_id: 11, public_id: 'b', pm_position: 1 }),
      row({ m_id: 12, public_id: 'c', pm_position: 2 }),
    ]);
    expect(full.position).toBe(3);
    expect(full.media.map((m: { position: number }) => m.position)).toEqual([0, 1, 2]);
  });

  it('AC-10: the full select aliases the pivot position so it cannot collide with portfolios.position', () => {
    const { repository } = buildRepo();
    const full: string[] = (repository as any).FULL_COLUMNS;
    expect(full).toContain('portfolios.position');
    expect(full).toContain('portfolio_media.position as pm_position');
    expect(full).not.toContain('portfolio_media.position');
  });

  it('AC-1: each list item carries position', () => {
    const { repository } = buildRepo();
    expect((repository as any).formatPortfolio(row({ position: 4 })).position).toBe(4);
  });
});
