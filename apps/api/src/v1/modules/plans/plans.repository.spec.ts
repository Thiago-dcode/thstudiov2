/**
 * The HTTP plans repository against a fake pg client (the only boundary faked): the SQL it sends
 * for `GET /v1/plans` and the shape it returns.
 */
const mockClient = {
  config: { client: 'postgres' },
  calls: [] as { sql: string; values: unknown[] }[],
  rows: [] as Record<string, unknown>[],
  query: async (sql: string, values: unknown[]) => {
    mockClient.calls.push({ sql, values });
    return { rows: mockClient.rows, rowCount: mockClient.rows.length };
  },
};
// The database package's compiled client (what `@repo/database/*` resolves to at runtime).
jest.mock('../../../../../../packages/database/dist/src/lib/client', () => ({
  __esModule: true,
  getClient: () => mockClient,
  initClient: jest.fn(),
  killClient: jest.fn(),
}));

import { PlansRepository } from './plans.repository';

const base = {
  base_price: 0,
  short_description: 's',
  description: 'd',
  stripe_id: 'prod',
  paypal_id: null,
  is_popular: false,
  max_clients: -1,
  max_projects: -1,
  max_portfolios: 3,
  max_collections: 3,
  max_services: 3,
  storage_limit_mb: 10240,
  limit_write_storage_per_day: 50,
  ai_credits: 20,
  is_active: true,
  top_tier: false,
  pp_paypal_id: null,
  allow_media_compression: false,
  pt_id: 1,
  language_code: 'ES',
  pt_short_description: 'ts',
  pt_description: 'td',
};

const planRows = (id: number, unique_identifier: string, name: string, ptName: string, is_free: boolean, prices: [number, string, number, string | null][]) =>
  prices.map(([pp_id, billing_type, price, pp_stripe_id]) => ({
    ...base,
    id,
    plan_id: id,
    pt_plan_id: id,
    unique_identifier,
    name,
    pt_name: ptName,
    is_free,
    pp_id,
    billing_type,
    price,
    pp_stripe_id,
    pp_is_active: true,
  }));

const where = (sql: string) => sql.slice(sql.search(/\bwhere\b/i));

describe('PlansRepository (api)', () => {
  const build = () => new PlansRepository({ language: 'ES' } as any);

  beforeEach(() => {
    mockClient.calls = [];
    mockClient.rows = [];
  });

  it('AC-11: findAll only reads active prices and filters on plans.is_active (qualified, no ambiguity)', async () => {
    await build().findAll({ is_active: true } as any);
    const { sql, values } = mockClient.calls[0];
    const w = where(sql);
    expect(w).toMatch(/plan_prices\.is_active\s*=\s*\$\d+/);
    expect(w).toMatch(/plans\.is_active\s*=\s*\$\d+/);
    // No unqualified `is_active` in the WHERE (plans and plan_prices both have one).
    expect(w.replace(/\w+\.is_active/g, '')).not.toMatch(/\bis_active\b/);
    expect(values).toEqual(expect.arrayContaining([true, 'ES']));
  });

  it('AC-3: selects unique_identifier and plan_prices.is_active as pp_is_active', async () => {
    await build().findAll({} as any);
    const { sql } = mockClient.calls[0];
    expect(sql).toContain('plans.unique_identifier');
    expect(sql).toContain('plan_prices.is_active as pp_is_active');
  });

  it('AC-3/AC-11: returns 3 plans with unique_identifier and is_active on each price; paid have MONTHLY+YEARLY, free has LIFETIME', async () => {
    mockClient.rows = [
      ...planRows(1, 'free', 'Artist', 'Artista', true, [[14, 'LIFETIME', 0, null]]),
      ...planRows(2, 'plus', 'Artist Plus', 'Artista Plus', false, [[25, 'MONTHLY', 6, 'price_a'], [26, 'YEARLY', 57.6, 'price_b']]),
      ...planRows(3, 'pro', 'Studio', 'Estudio', false, [[35, 'MONTHLY', 9, 'price_c'], [36, 'YEARLY', 86.4, 'price_d']]),
    ];
    const plans = await build().findAll({ is_active: true } as any);
    expect(plans).toHaveLength(3);
    expect(plans.map((p) => p.unique_identifier)).toEqual(['free', 'plus', 'pro']);
    expect(plans.map((p) => p.translation?.name)).toEqual(['Artista', 'Artista Plus', 'Estudio']);
    for (const plan of plans) {
      for (const price of plan.prices) expect(price.is_active).toBe(true);
      expect(plan.is_active).toBe(true);
    }
    expect(plans[0].prices.map((p) => p.billing_type)).toEqual(['LIFETIME']);
    expect(plans[1].prices.map((p) => [p.billing_type, p.price])).toEqual([
      ['MONTHLY', 6],
      ['YEARLY', 57.6],
    ]);
    expect(plans[2].prices.map((p) => [p.billing_type, p.price])).toEqual([
      ['MONTHLY', 9],
      ['YEARLY', 86.4],
    ]);
  });

  it('AC-3: price is_active comes from pp_is_active, not from plans.is_active', async () => {
    mockClient.rows = planRows(2, 'plus', 'Artist Plus', 'Artista Plus', false, [[25, 'MONTHLY', 6, 'p']]).map((r) => ({
      ...r,
      is_active: true,
      pp_is_active: false,
    }));
    const [plan] = await build().findAll({} as any);
    expect(plan.is_active).toBe(true);
    expect(plan.prices[0].is_active).toBe(false);
  });
});
