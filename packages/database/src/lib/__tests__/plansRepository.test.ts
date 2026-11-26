/**
 * The Nest-free PlansRepository against a fake pg client: the SQL it sends and how it formats
 * the rows it gets back.
 */
const mockClient = {
  config: { client: 'postgres' },
  calls: [] as { sql: string; values: unknown[] }[],
  rows: [] as Record<string, unknown>[],
  query: jest.fn(async (sql: string, values: unknown[]) => {
    mockClient.calls.push({ sql, values });
    return { rows: mockClient.rows, rowCount: mockClient.rows.length };
  }),
};
jest.mock('../client', () => ({
  __esModule: true,
  getClient: () => mockClient,
  initClient: jest.fn(),
  killClient: jest.fn(),
}));

import { PlansRepository } from '../repositories/plans.repository';

const row = (over: Record<string, unknown>) => ({
  id: 1,
  base_price: 0,
  name: 'Artist',
  unique_identifier: 'free',
  short_description: 's',
  description: 'd',
  is_free: true,
  stripe_id: 'prod_free',
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
  price: 0,
  plan_id: 1,
  pp_paypal_id: null,
  pp_stripe_id: null,
  pp_id: 14,
  billing_type: 'LIFETIME',
  pp_is_active: true,
  allow_media_compression: false,
  ...over,
});

/** The WHERE clause of a query (everything from the WHERE keyword on). */
const whereOf = (sql: string) => {
  const at = sql.search(/\bwhere\b/i);
  return at === -1 ? '' : sql.slice(at);
};

describe('PlansRepository (database)', () => {
  beforeEach(() => {
    mockClient.calls = [];
    mockClient.rows = [];
  });

  it('AC-3: selects plans.unique_identifier and plan_prices.is_active aliased as pp_is_active (no collision with plans.is_active)', () => {
    const columns = new PlansRepository().BASE_COLUMNS;
    expect(columns).toContain('plans.unique_identifier');
    expect(columns).toContain('plan_prices.is_active as pp_is_active');
    expect(columns).toContain('plans.is_active');
    expect(columns).not.toContain('plan_prices.is_active');
  });

  it('AC-3/AC-13: findFreePlan maps unique_identifier and price is_active, and keeps the plan is_active separate', async () => {
    mockClient.rows = [row({})];
    const plan = await new PlansRepository().findFreePlan();
    expect(plan.unique_identifier).toBe('free');
    expect(plan.is_active).toBe(true);
    expect(plan.prices).toEqual([
      expect.objectContaining({ id: 14, billing_type: 'LIFETIME', price: 0, is_active: true }),
    ]);
  });

  it('AC-13: findFreePlan filters on plan_prices.is_active = true (and plans.is_active)', async () => {
    mockClient.rows = [row({})];
    await new PlansRepository().findFreePlan();
    const { sql, values } = mockClient.calls[0];
    const where = whereOf(sql);
    expect(where).toMatch(/plan_prices\.is_active\s*=\s*\$\d+/);
    expect(where).toMatch(/plans\.is_active\s*=\s*\$\d+/);
    expect(values.filter((v) => v === true).length).toBeGreaterThanOrEqual(3);
  });

  it('AC-14: findUserActivePlan does not filter on plan_prices.is_active (legacy subscribers on retired prices)', async () => {
    mockClient.rows = [
      row({ id: 3, name: 'Studio', unique_identifier: 'pro', is_free: false, plan_id: 3, pp_id: 32, billing_type: 'QUARTERLY', price: 32, pp_is_active: false, max_portfolios: -1 }),
    ];
    const plan = await new PlansRepository().findUserActivePlan(9);
    const where = whereOf(mockClient.calls[0].sql);
    expect(where).not.toMatch(/plan_prices\.is_active/);
    expect(where).toMatch(/plan_subscriptions\.is_active/);
    // The retired price still yields the user's plan and limits.
    expect(plan).toMatchObject({ id: 3, unique_identifier: 'pro', max_portfolios: -1 });
    expect(plan.prices).toEqual([expect.objectContaining({ id: 32, billing_type: 'QUARTERLY', is_active: false })]);
  });

  it('AC-3: a plan with both active and retired price rows keeps each row\'s own is_active', async () => {
    mockClient.rows = [
      row({ id: 2, unique_identifier: 'plus', plan_id: 2, pp_id: 21, billing_type: 'MONTHLY', price: 9, pp_is_active: false }),
      row({ id: 2, unique_identifier: 'plus', plan_id: 2, pp_id: 25, billing_type: 'MONTHLY', price: 6, pp_is_active: true }),
    ];
    const plan = await new PlansRepository().findUserActivePlan(9);
    expect(plan.prices.map((p) => [p.id, p.is_active])).toEqual([
      [21, false],
      [25, true],
    ]);
  });
});
