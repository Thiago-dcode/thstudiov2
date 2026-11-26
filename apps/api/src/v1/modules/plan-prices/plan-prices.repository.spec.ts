/**
 * PlanPricesRepository against a fake pg client: webhooks resolve subscribers through
 * `findOneByColumn('plan_prices.stripe_id', ...)`, so retired rows must still be found.
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
jest.mock('../../../../../../packages/database/dist/src/lib/client', () => ({
  __esModule: true,
  getClient: () => mockClient,
  initClient: jest.fn(),
  killClient: jest.fn(),
}));

import { PlanPricesRepository } from './plan-prices.repository';

const retiredRow = {
  id: 31,
  stripe_id: 'price_pro_m14',
  paypal_id: null,
  plan_id: 3,
  price: 14,
  billing_type: 'MONTHLY',
  is_active: false,
  p_id: 3,
  p_stripe_id: 'prod_pro',
  p_paypal_id: null,
  p_is_active: true,
  name: 'Studio',
  short_description: 's',
  base_price: 9,
  is_free: false,
  top_tier: true,
};

const where = (sql: string) => sql.slice(sql.search(/\bwhere\b/i));

describe('PlanPricesRepository', () => {
  beforeEach(() => {
    mockClient.calls = [];
    mockClient.rows = [];
  });

  it('AC-9: findOneByColumn(stripe_id) of a retired price still returns that row (no is_active filter)', async () => {
    mockClient.rows = [retiredRow];
    const result = await new PlanPricesRepository().findOneByColumn('plan_prices.stripe_id', 'price_pro_m14');
    const w = where(mockClient.calls[0].sql);
    expect(w).not.toMatch(/is_active/);
    expect(mockClient.calls[0].values).toContain('price_pro_m14');
    expect(result).toMatchObject({ id: 31, stripe_id: 'price_pro_m14', price: 14, is_active: false });
  });

  it('AC-9: findOne(id) of a retired price still returns it (no is_active filter)', async () => {
    mockClient.rows = [retiredRow];
    const result = await new PlanPricesRepository().findOne(31);
    expect(where(mockClient.calls[0].sql)).not.toMatch(/is_active/);
    expect(result?.id).toBe(31);
  });

  it('AC-3/AC-12: selects plan_prices.is_active and plans.is_active as p_is_active; the price and plan flags stay separate', async () => {
    mockClient.rows = [retiredRow];
    const result = await new PlanPricesRepository().findOne(31);
    const { sql } = mockClient.calls[0];
    expect(sql).toContain('plan_prices.is_active');
    expect(sql).toContain('plans.is_active as p_is_active');
    expect(sql).not.toMatch(/plans\.is_active(?! as p_is_active)/);
    expect(result?.is_active).toBe(false);
    expect(result?.plan.is_active).toBe(true);
  });
});
