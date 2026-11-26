/**
 * Runs the real plans seed (`main`) against an in-memory fake of the DB facade and a fake Stripe
 * client. Only the boundaries are faked: the DB (`Query`), Stripe, the console and the structured
 * logger. The matching / versioning logic under test is the real one.
 */
type Row = Record<string, any>;
type Op =
  | { type: 'update'; table: string; ids: number[]; columns: string[]; values: unknown[]; before: Row[] }
  | { type: 'insert'; table: string; row: Row };

const mockDb: { tables: Record<string, Row[]>; ops: Op[]; seq: number } = { tables: {}, ops: [], seq: 1000 };

jest.mock('../../lib/facades', () => {
  class FakeQuery {
    private wheres: [string, string, unknown][] = [];
    private orders: [string, string][] = [];
    constructor(private readonly table: string) {}
    static table(table: string) {
      if (!mockDb.tables[table]) mockDb.tables[table] = [];
      return new FakeQuery(table);
    }
    where(column: string, operator: string, value: unknown) {
      this.wheres.push([column.replace(/^\w+\./, ''), operator, value]);
      return this;
    }
    orderBy(column: string, dir = 'ASC') {
      this.orders.push([column.replace(/^\w+\./, ''), dir]);
      return this;
    }
    private matching(): Row[] {
      const rows = mockDb.tables[this.table].filter((row) =>
        this.wheres.every(([c, op, v]) => {
          if (op !== '=') throw new Error(`fake Query: unsupported operator ${op}`);
          return row[c] === v;
        }),
      );
      for (const [c, dir] of [...this.orders].reverse()) {
        rows.sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (dir.toUpperCase() === 'DESC' ? -1 : 1));
      }
      return rows;
    }
    async first() {
      const row = this.matching()[0];
      return row ? { ...row } : null;
    }
    async get() {
      return this.matching().map((r) => ({ ...r }));
    }
    async update(columns: string[], values: unknown[]) {
      const rows = this.matching();
      mockDb.ops.push({
        type: 'update',
        table: this.table,
        ids: rows.map((r) => r.id),
        columns,
        values,
        before: rows.map((r) => ({ ...r })),
      });
      for (const row of rows) columns.forEach((c, i) => (row[c] = values[i]));
      return { rowCount: rows.length };
    }
    private doInsert(columns: string[], values: unknown[]) {
      const row: Row = { id: ++mockDb.seq };
      columns.forEach((c, i) => (row[c] = values[i]));
      if (this.table === 'plan_prices' && row.is_active === undefined) row.is_active = true;
      if (this.table === 'plans' && row.unique_identifier === undefined) row.unique_identifier = null;
      mockDb.tables[this.table].push(row);
      mockDb.ops.push({ type: 'insert', table: this.table, row: { ...row } });
      return row;
    }
    async insert(columns: string[], values: unknown[]) {
      this.doInsert(columns, values);
      return { rowCount: 1 };
    }
    async insertAndGet(columns: string[], values: unknown[]) {
      return { ...this.doInsert(columns, values) };
    }
  }
  return { Query: FakeQuery };
});

const mockStripeState: {
  calls: { method: string; args: unknown[] }[];
  missingProducts: Set<string>;
  failArchive: Set<string>;
  /** Stripe-side state: prices archived so far. Survives `reset()` (a re-run), cleared per test. */
  archivedPrices: Set<string>;
  /**
   * Stripe-side `tax_behavior` per price. Prices not listed read as `unspecified` (as legacy
   * prices created without it do). Survives `reset()`, cleared per test.
   */
  taxBehavior: Map<string, string>;
  seq: number;
} = { calls: [], missingProducts: new Set(), failArchive: new Set(), archivedPrices: new Set(), taxBehavior: new Map(), seq: 0 };

jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripeWebhookSecret: '',
  stripe: {
    products: {
      update: async (id: string, params: unknown) => {
        mockStripeState.calls.push({ method: 'products.update', args: [id, params] });
        if (mockStripeState.missingProducts.has(id)) {
          throw Object.assign(new Error(`No such product: ${id}`), { name: 'StripeInvalidRequestError', code: 'resource_missing' });
        }
        return { id, object: 'product' };
      },
      create: async (params: unknown) => {
        mockStripeState.calls.push({ method: 'products.create', args: [params] });
        return { id: `prod_new_${++mockStripeState.seq}`, object: 'product' };
      },
    },
    prices: {
      create: async (params: unknown) => {
        mockStripeState.calls.push({ method: 'prices.create', args: [params] });
        const id = `price_new_${++mockStripeState.seq}`;
        mockStripeState.taxBehavior.set(id, (params as { tax_behavior?: string })?.tax_behavior ?? 'unspecified');
        return { id, object: 'price' };
      },
      update: async (id: string, params: unknown) => {
        mockStripeState.calls.push({ method: 'prices.update', args: [id, params] });
        if (mockStripeState.failArchive.has(id)) {
          throw Object.assign(new Error('Stripe is down'), {
            name: 'StripeAPIError',
            raw: { headers: { authorization: 'Bearer sk_test_SEEDSECRET' } },
          });
        }
        if ((params as { active?: boolean })?.active === false) mockStripeState.archivedPrices.add(id);
        const tax = (params as { tax_behavior?: string })?.tax_behavior;
        if (tax) {
          // Stripe only allows setting tax_behavior once, from unspecified.
          const currentTax = mockStripeState.taxBehavior.get(id) ?? 'unspecified';
          if (currentTax !== 'unspecified') throw Object.assign(new Error('tax_behavior cannot be changed'), { name: 'StripeInvalidRequestError' });
          mockStripeState.taxBehavior.set(id, tax);
        }
        return { id, object: 'price', active: !mockStripeState.archivedPrices.has(id) };
      },
      retrieve: async (id: string) => {
        mockStripeState.calls.push({ method: 'prices.retrieve', args: [id] });
        return {
          id,
          object: 'price',
          active: !mockStripeState.archivedPrices.has(id),
          tax_behavior: mockStripeState.taxBehavior.get(id) ?? 'unspecified',
        };
      },
    },
  },
}));

jest.mock('@repo/backend-lib/utils/console', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('@repo/common-lib/config', () => ({ config: () => ({ redis: { url: 'redis://stub' } }) }));

const mockLines: { level: string; message: string; context: Record<string, any> }[] = [];
const mockDbcliLogger = jest.fn();
jest.mock('../../bin/dbcli-audit', () => ({
  dbcliLogger: (channel: string, operation: string) => {
    mockDbcliLogger(channel, operation);
    const at = (level: string) => (message: string, context: Record<string, any> = {}) =>
      mockLines.push({ level, message, context });
    return { info: at('info'), error: at('error'), warn: at('warn'), success: at('success'), critical: at('critical'), debug: at('debug') };
  },
}));

import { main } from '../plans';

// ---------------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------------

const planRow = (id: number, name: string, unique_identifier: string | null, stripe_id: string | null): Row => ({
  id,
  name,
  unique_identifier,
  stripe_id,
  paypal_id: null,
  short_description: 'old',
  description: 'old',
  logo: `/plans/${name.toLowerCase()}`,
  base_price: 0,
  is_active: true,
  is_free: name === 'Beginner',
  is_popular: false,
  top_tier: false,
  storage_limit_mb: 1024,
  max_portfolios: 2,
  max_services: 2,
  max_collections: 2,
  max_projects: 2,
  max_clients: 2,
  ai_credits: 5,
  limit_write_storage_per_day: 10,
  allow_media_compression: false,
});

const priceRow = (id: number, plan_id: number, billing_type: string, price: number, stripe_id: string | null, is_active = true): Row => ({
  id,
  plan_id,
  billing_type,
  price,
  stripe_id,
  paypal_id: null,
  is_active,
});

/** A production-like DB before this change (as the migration leaves it: is_active = true, keys backfilled or not). */
const legacyDb = (opts: { backfilled: boolean }) => ({
  plans: [
    planRow(1, 'Beginner', opts.backfilled ? 'free' : null, 'prod_free'),
    planRow(2, 'Freelancer', opts.backfilled ? 'plus' : null, 'prod_plus'),
    planRow(3, 'Studio', opts.backfilled ? 'pro' : null, 'prod_pro'),
  ],
  plan_prices: [
    priceRow(11, 1, 'MONTHLY', 0, 'price_free_m'),
    priceRow(12, 1, 'QUARTERLY', 0, null),
    priceRow(13, 1, 'YEARLY', 0, 'price_free_y'),
    priceRow(14, 1, 'LIFETIME', 0, null),
    priceRow(21, 2, 'MONTHLY', 9, 'price_plus_m9'),
    priceRow(22, 2, 'QUARTERLY', 20, 'price_plus_q20'),
    priceRow(23, 2, 'YEARLY', 72, 'price_plus_y72'),
    priceRow(24, 2, 'LIFETIME', 300, 'price_plus_l300'),
    priceRow(31, 3, 'MONTHLY', 14, 'price_pro_m14'),
    priceRow(32, 3, 'QUARTERLY', 32, 'price_pro_q32'),
    priceRow(33, 3, 'YEARLY', 112, 'price_pro_y112'),
  ],
  plan_translations: [
    { id: 101, plan_id: 1, language_code: 'EN', name: 'Beginner', short_description: 'o', description: 'o' },
    { id: 102, plan_id: 1, language_code: 'ES', name: 'Iniciante', short_description: 'o', description: 'o' },
    { id: 103, plan_id: 1, language_code: 'PT', name: 'Iniciante', short_description: 'o', description: 'o' },
    { id: 201, plan_id: 2, language_code: 'EN', name: 'Freelancer', short_description: 'o', description: 'o' },
    { id: 301, plan_id: 3, language_code: 'EN', name: 'Studio', short_description: 'o', description: 'o' },
  ],
});

const load = (tables: Record<string, Row[]>) => {
  mockDb.tables = JSON.parse(JSON.stringify(tables));
  mockDb.ops = [];
  mockDb.seq = 1000;
};

const reset = () => {
  mockStripeState.calls = [];
  mockStripeState.missingProducts = new Set();
  mockStripeState.failArchive = new Set();
  mockStripeState.seq = 0;
  mockLines.length = 0;
  mockDbcliLogger.mockClear();
};

const plans = () => mockDb.tables.plans;
const prices = () => mockDb.tables.plan_prices;
const activePrices = (planId: number) =>
  prices()
    .filter((p) => p.plan_id === planId && p.is_active)
    .map((p) => `${p.billing_type}:${p.price}`)
    .sort();
const stripeCalls = (method: string) => mockStripeState.calls.filter((c) => c.method === method);
const createdStripePrices = () => stripeCalls('prices.create').map((c) => c.args[0] as Record<string, any>);
const archivedStripeIds = () =>
  stripeCalls('prices.update')
    .filter((c) => (c.args[1] as any)?.active === false)
    .map((c) => c.args[0] as string);

beforeEach(reset);
beforeEach(() => {
  mockStripeState.archivedPrices.clear();
  mockStripeState.taxBehavior.clear();
});

// ---------------------------------------------------------------------------------------------

describe('plans seed against a legacy DB', () => {
  beforeEach(() => load(legacyDb({ backfilled: false })));

  it('AC-4: updates the legacy plans in place: same ids, no new plan rows, new names and limits', async () => {
    await main();
    expect(plans().map((p) => p.id)).toEqual([1, 2, 3]);
    expect(mockDb.ops.filter((o) => o.type === 'insert' && o.table === 'plans')).toHaveLength(0);
    expect(plans().map((p) => [p.id, p.name, p.unique_identifier])).toEqual([
      [1, 'Artist', 'free'],
      [2, 'Artist Plus', 'plus'],
      [3, 'Studio', 'pro'],
    ]);
    expect(plans()[0]).toMatchObject({ storage_limit_mb: 10240, max_portfolios: 3, max_collections: 3, max_services: 3, ai_credits: 20, max_projects: -1, max_clients: -1 });
    expect(plans()[1]).toMatchObject({ storage_limit_mb: 102400, max_portfolios: 5, max_collections: 10, max_services: 5, ai_credits: 200, base_price: 6 });
    expect(plans()[2]).toMatchObject({ storage_limit_mb: 256000, max_portfolios: -1, max_collections: -1, max_services: -1, ai_credits: 400, base_price: 9 });
    // Stripe products kept, not duplicated.
    expect(plans().map((p) => p.stripe_id)).toEqual(['prod_free', 'prod_plus', 'prod_pro']);
  });

  it('AC-4: updates the Stripe product name and description by id, never creating a product', async () => {
    await main();
    expect(stripeCalls('products.create')).toHaveLength(0);
    const updates = stripeCalls('products.update').map((c) => [c.args[0], (c.args[1] as any).name]);
    expect(updates).toEqual([
      ['prod_free', 'Artist'],
      ['prod_plus', 'Artist Plus'],
      ['prod_pro', 'Studio'],
    ]);
    for (const c of stripeCalls('products.update')) expect((c.args[1] as any).description).toEqual(expect.any(String));
  });

  it('AC-4: updates existing translations in place and inserts the missing ones (EN/ES/PT)', async () => {
    await main();
    const t = mockDb.tables.plan_translations;
    const name = (planId: number, code: string) => t.filter((r) => r.plan_id === planId && r.language_code === code);
    expect(name(1, 'EN')).toEqual([expect.objectContaining({ id: 101, name: 'Artist' })]);
    expect(name(1, 'ES')).toEqual([expect.objectContaining({ id: 102, name: 'Artista' })]);
    expect(name(1, 'PT')).toEqual([expect.objectContaining({ id: 103, name: 'Artista' })]);
    expect(name(2, 'ES')).toEqual([expect.objectContaining({ name: 'Artista Plus' })]);
    expect(name(3, 'ES')).toEqual([expect.objectContaining({ name: 'Estudio' })]);
    expect(name(3, 'PT')).toEqual([expect.objectContaining({ name: 'Estúdio' })]);
    expect(t).toHaveLength(9);
  });

  it('AC-7/AC-26: the active prices are exactly free LIFETIME 0, plus MONTHLY 6/YEARLY 60, pro MONTHLY 9/YEARLY 90', async () => {
    await main();
    expect(activePrices(1)).toEqual(['LIFETIME:0']);
    expect(activePrices(2)).toEqual(['MONTHLY:6', 'YEARLY:60']);
    expect(activePrices(3)).toEqual(['MONTHLY:9', 'YEARLY:90']);
    const freeLifetime = prices().find((p) => p.plan_id === 1 && p.is_active)!;
    expect(freeLifetime.id).toBe(14);
    expect(freeLifetime.stripe_id).toBeNull();
  });

  it('AC-7/AC-26: creates exactly four Stripe prices: eur 600/6000/900/9000, month/year', async () => {
    await main();
    const created = createdStripePrices().map((p) => [p.currency, p.unit_amount, p.recurring.interval]);
    expect(created.sort()).toEqual(
      [
        ['eur', 600, 'month'],
        ['eur', 6000, 'year'],
        ['eur', 900, 'month'],
        ['eur', 9000, 'year'],
      ].sort(),
    );
    // Each new active row carries its own new Stripe price id.
    for (const planId of [2, 3]) {
      for (const row of prices().filter((p) => p.plan_id === planId && p.is_active)) {
        expect(row.stripe_id).toMatch(/^price_new_/);
      }
    }
  });

  it('AC-8: retired rows are kept with is_active=false and unchanged price/stripe_id; no row deleted', async () => {
    const before = JSON.parse(JSON.stringify(prices())) as Row[];
    await main();
    const retiredIds = [11, 12, 13, 21, 22, 23, 24, 31, 32, 33];
    for (const old of before) {
      const now = prices().find((p) => p.id === old.id);
      expect(now).toBeDefined();
      expect(now!.price).toBe(old.price);
      expect(now!.stripe_id).toBe(old.stripe_id);
      expect(now!.is_active).toBe(!retiredIds.includes(old.id));
    }
    expect(prices()).toHaveLength(before.length + 4);
  });

  it('AC-8: every retired row with a stripe_id has its Stripe price archived (active:false)', async () => {
    await main();
    expect(archivedStripeIds().sort()).toEqual(
      [
        'price_free_m',
        'price_free_y',
        'price_plus_m9',
        'price_plus_q20',
        'price_plus_y72',
        'price_plus_l300',
        'price_pro_m14',
        'price_pro_q32',
        'price_pro_y112',
      ].sort(),
    );
    // Archived once each in a single run.
    expect(new Set(archivedStripeIds()).size).toBe(archivedStripeIds().length);
  });

  it('AC-9: an amount change inserts the new active row before the old row is retired', async () => {
    await main();
    for (const [oldId, planId, billingType] of [
      [21, 2, 'MONTHLY'],
      [23, 2, 'YEARLY'],
      [31, 3, 'MONTHLY'],
      [33, 3, 'YEARLY'],
    ] as const) {
      const insertAt = mockDb.ops.findIndex(
        (o) => o.type === 'insert' && o.table === 'plan_prices' && o.row.plan_id === planId && o.row.billing_type === billingType,
      );
      const retireAt = mockDb.ops.findIndex(
        (o) => o.type === 'update' && o.table === 'plan_prices' && o.ids.includes(oldId) && o.columns.includes('is_active'),
      );
      expect(insertAt).toBeGreaterThanOrEqual(0);
      expect(retireAt).toBeGreaterThan(insertAt);
    }
  });

  it('AC-9: never rewrites price or stripe_id on an existing row that has a stripe_id', async () => {
    await main();
    const offending = mockDb.ops.filter(
      (o) =>
        o.type === 'update' &&
        o.table === 'plan_prices' &&
        o.before.some((r) => r.stripe_id) &&
        o.columns.some((c) => c === 'price' || c === 'stripe_id'),
    );
    expect(offending).toEqual([]);
  });

  it('AC-9: the retired old Stripe price still resolves to its own row (webhook lookup by stripe_id)', async () => {
    await main();
    const byStripeId = (id: string) => prices().filter((p) => p.stripe_id === id);
    expect(byStripeId('price_pro_m14')).toEqual([expect.objectContaining({ id: 31, plan_id: 3, price: 14, is_active: false })]);
    expect(byStripeId('price_plus_q20')).toEqual([expect.objectContaining({ id: 22, plan_id: 2, is_active: false })]);
  });

  it('AC-6: a second run creates zero plans, zero plan_prices rows and zero Stripe prices', async () => {
    await main();
    const plansAfterFirst = plans().length;
    const pricesAfterFirst = prices().length;
    const snapshot = JSON.parse(JSON.stringify(prices()));
    reset();
    await main();
    expect(plans()).toHaveLength(plansAfterFirst);
    expect(prices()).toHaveLength(pricesAfterFirst);
    expect(createdStripePrices()).toHaveLength(0);
    expect(stripeCalls('products.create')).toHaveLength(0);
    expect(prices()).toEqual(snapshot);
    const done = mockLines.find((l) => l.message === 'Plans seed completed')!;
    expect(done.context).toEqual({ plans: 3, prices_created: 0, prices_retired: 0 });
    expect(mockLines.filter((l) => l.message === 'Plan matched').map((l) => l.context.matched_by)).toEqual([
      'unique_identifier',
      'unique_identifier',
      'unique_identifier',
    ]);
  });

  it('AC-22: logs on channel plans / operation seed-plans, one success line with counts', async () => {
    await main();
    expect(mockDbcliLogger).toHaveBeenCalledTimes(1);
    expect(mockDbcliLogger).toHaveBeenCalledWith('plans', 'seed-plans');
    const done = mockLines.filter((l) => l.message === 'Plans seed completed');
    expect(done).toHaveLength(1);
    expect(done[0].level).toBe('success');
    expect(done[0].context).toEqual({ plans: 3, prices_created: 4, prices_retired: 10 });
    expect(mockLines.filter((l) => l.level === 'critical')).toHaveLength(0);
  });

  it('AC-22: a failed archive logs one error line with step and stripe_price_id, and the run continues', async () => {
    mockStripeState.failArchive.add('price_pro_m14');
    await main();
    const failed = mockLines.filter((l) => l.message === 'Stripe price archive failed');
    expect(failed).toHaveLength(1);
    expect(failed[0].level).toBe('error');
    expect(failed[0].context).toMatchObject({ stripe_price_id: 'price_pro_m14', step: 'stripe-price-archive', error_name: 'StripeAPIError' });
    // The run still completed: the row is retired and the summary line was written.
    expect(prices().find((p) => p.id === 31)!.is_active).toBe(false);
    expect(mockLines.filter((l) => l.message === 'Plans seed completed')).toHaveLength(1);
    const dumped = JSON.stringify(mockLines);
    expect(dumped).not.toContain('sk_test_SEEDSECRET');
    expect(dumped).not.toMatch(/"object":"(price|product)"|authorization/);
  });

  it('AC-8/AC-22: a re-run re-archives a price whose archive failed before (heal pass)', async () => {
    mockStripeState.failArchive.add('price_pro_m14');
    await main();
    reset();
    await main();
    expect(archivedStripeIds()).toContain('price_pro_m14');
    expect(mockLines.filter((l) => l.message === 'Stripe price archive failed')).toHaveLength(0);
  });
});

describe('plans seed: matching (AC-5)', () => {
  it('AC-5: matched by legacy name backfills unique_identifier and logs matched_by legacy_name', async () => {
    load(legacyDb({ backfilled: false }));
    await main();
    const matched = mockLines.filter((l) => l.message === 'Plan matched').map((l) => [l.context.plan_id, l.context.matched_by, l.context.step]);
    expect(matched).toEqual([
      [1, 'legacy_name', 'match-plan'],
      [2, 'legacy_name', 'match-plan'],
      [3, 'legacy_name', 'match-plan'],
    ]);
    expect(plans().map((p) => p.unique_identifier)).toEqual(['free', 'plus', 'pro']);
  });

  it('AC-5: after the migration backfill, plans are matched by unique_identifier first', async () => {
    load(legacyDb({ backfilled: true }));
    await main();
    expect(mockLines.filter((l) => l.message === 'Plan matched').map((l) => l.context.matched_by)).toEqual([
      'unique_identifier',
      'unique_identifier',
      'unique_identifier',
    ]);
    expect(plans().map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('AC-5: unique_identifier wins over a name match (renamed row keeps its id)', async () => {
    load({ ...legacyDb({ backfilled: false }), plans: [planRow(7, 'Something else', 'plus', 'prod_x'), planRow(1, 'Beginner', null, 'prod_free'), planRow(3, 'Studio', null, 'prod_pro')] });
    await main();
    expect(plans().find((p) => p.unique_identifier === 'plus')!.id).toBe(7);
    expect(plans()).toHaveLength(3);
  });

  it('AC-5: falls back to the target name (a partially-run seed), backfilling the key', async () => {
    load({ ...legacyDb({ backfilled: false }), plans: [planRow(1, 'Artist', null, 'prod_free'), planRow(2, 'Artist Plus', null, 'prod_plus'), planRow(3, 'Studio', null, 'prod_pro')] });
    await main();
    expect(plans().map((p) => [p.id, p.unique_identifier])).toEqual([
      [1, 'free'],
      [2, 'plus'],
      [3, 'pro'],
    ]);
    const matchedBy = mockLines.filter((l) => l.message === 'Plan matched').map((l) => l.context.matched_by);
    expect(matchedBy[0]).toBe('name');
    expect(matchedBy[1]).toBe('name');
  });

  it('AC-5: inserts only when nothing matches (empty DB), then a re-run inserts nothing', async () => {
    load({ plans: [], plan_prices: [], plan_translations: [] });
    await main();
    expect(plans().map((p) => p.unique_identifier)).toEqual(['free', 'plus', 'pro']);
    expect(mockLines.filter((l) => l.message === 'Plan matched').map((l) => l.context.matched_by)).toEqual(['inserted', 'inserted', 'inserted']);
    expect(activePrices(plans()[0].id)).toEqual(['LIFETIME:0']);
    expect(activePrices(plans()[1].id)).toEqual(['MONTHLY:6', 'YEARLY:60']);
    expect(stripeCalls('products.create')).toHaveLength(3);
    const counts = [plans().length, prices().length];
    reset();
    await main();
    expect([plans().length, prices().length]).toEqual(counts);
    expect(createdStripePrices()).toHaveLength(0);
    expect(stripeCalls('products.create')).toHaveLength(0);
  });

  it('AC-5: a name-matched row with a different non-null unique_identifier throws (no overwrite, no duplicate)', async () => {
    // "Freelancer" already carries the key "pro"; matching it for "plus" must fail. (Free plan
    // seeds first and succeeds; "plus" has no row by key.)
    load({
      ...legacyDb({ backfilled: false }),
      plans: [planRow(1, 'Beginner', 'free', 'prod_free'), planRow(2, 'Freelancer', 'pro', 'prod_plus')],
    });
    await expect(main()).rejects.toThrow();
    expect(plans().find((p) => p.id === 2)).toMatchObject({ name: 'Freelancer', unique_identifier: 'pro' });
    expect(plans()).toHaveLength(2);
    expect(mockDb.ops.filter((o) => o.type === 'insert' && o.table === 'plans')).toHaveLength(0);
  });
});

describe('plans seed: price edge cases', () => {
  it('AC-9: a paid active row with the right amount but no stripe_id gets a Stripe price on that same row', async () => {
    load({
      plans: [planRow(1, 'Beginner', 'free', 'prod_free'), planRow(2, 'Freelancer', 'plus', 'prod_plus'), planRow(3, 'Studio', 'pro', 'prod_pro')],
      plan_prices: [
        priceRow(14, 1, 'LIFETIME', 0, null),
        priceRow(21, 2, 'MONTHLY', 6, null),
        priceRow(23, 2, 'YEARLY', 60, 'price_y'),
        priceRow(31, 3, 'MONTHLY', 9, 'price_pm'),
        priceRow(33, 3, 'YEARLY', 90, 'price_py'),
      ],
      plan_translations: [],
    });
    await main();
    expect(prices()).toHaveLength(5);
    expect(prices().find((p) => p.id === 21)).toMatchObject({ is_active: true, price: 6, stripe_id: expect.stringMatching(/^price_new_/) });
    expect(createdStripePrices()).toEqual([expect.objectContaining({ unit_amount: 600, recurring: { interval: 'month' } })]);
    expect(archivedStripeIds()).toEqual([]);
  });

  it('AC-9: amounts are compared in minor units (float noise on a read-back is not a change)', async () => {
    load({
      plans: [planRow(1, 'Beginner', 'free', 'prod_free'), planRow(2, 'Freelancer', 'plus', 'prod_plus'), planRow(3, 'Studio', 'pro', 'prod_pro')],
      plan_prices: [
        priceRow(14, 1, 'LIFETIME', 0, null),
        priceRow(21, 2, 'MONTHLY', 6, 'price_m'),
        priceRow(23, 2, 'YEARLY', 60.000001, 'price_y'),
        priceRow(31, 3, 'MONTHLY', 9, 'price_pm'),
        priceRow(33, 3, 'YEARLY', 89.999999, 'price_py'),
      ],
      plan_translations: [],
    });
    await main();
    expect(prices()).toHaveLength(5);
    expect(createdStripePrices()).toHaveLength(0);
    expect(prices().every((p) => p.is_active)).toBe(true);
  });

  it('AC-13: the free LIFETIME row is never retired', async () => {
    load(legacyDb({ backfilled: true }));
    await main();
    await main();
    expect(prices().find((p) => p.id === 14)).toMatchObject({ is_active: true, billing_type: 'LIFETIME', price: 0 });
    expect(prices().filter((p) => p.plan_id === 1 && p.is_active)).toHaveLength(1);
  });
});

describe('plans seed: VAT-inclusive prices (Addendum A)', () => {
  const taxUpdates = () =>
    stripeCalls('prices.update')
      .filter((c) => (c.args[1] as any)?.tax_behavior !== undefined)
      .map((c) => [c.args[0], (c.args[1] as any).tax_behavior]);
  const taxLines = () => mockLines.filter((l) => l.context.step === 'stripe-price-tax');

  /** Current amounts already in place, with Stripe prices in every tax state, plus a retired row. */
  const currentDb = () => ({
    plans: [planRow(1, 'Beginner', 'free', 'prod_free'), planRow(2, 'Freelancer', 'plus', 'prod_plus'), planRow(3, 'Studio', 'pro', 'prod_pro')],
    plan_prices: [
      priceRow(14, 1, 'LIFETIME', 0, null),
      priceRow(21, 2, 'MONTHLY', 6, 'price_m_unspecified'),
      priceRow(23, 2, 'YEARLY', 60, 'price_y_exclusive'),
      priceRow(31, 3, 'MONTHLY', 9, 'price_pm_inclusive'),
      priceRow(33, 3, 'YEARLY', 90, 'price_py_unspecified'),
      priceRow(39, 3, 'MONTHLY', 14, 'price_retired_unspecified', false),
    ],
    plan_translations: [],
  });
  const setTax = () => {
    mockStripeState.taxBehavior.set('price_y_exclusive', 'exclusive');
    mockStripeState.taxBehavior.set('price_pm_inclusive', 'inclusive');
    // Retired, and already archived in Stripe.
    mockStripeState.archivedPrices.add('price_retired_unspecified');
  };

  it('AC-23: every Stripe price the seed creates is tax_behavior inclusive', async () => {
    load(legacyDb({ backfilled: false }));
    await main();
    expect(createdStripePrices()).toHaveLength(4);
    for (const p of createdStripePrices()) expect(p.tax_behavior).toBe('inclusive');
    // Freshly created prices are never re-updated for tax.
    expect(taxUpdates()).toEqual([]);
  });

  it('AC-23: unspecified -> updated to inclusive; exclusive -> one warn and no update; inclusive -> no update', async () => {
    load(currentDb());
    setTax();
    await main();
    expect(taxUpdates().sort()).toEqual([
      ['price_m_unspecified', 'inclusive'],
      ['price_py_unspecified', 'inclusive'],
    ]);
    const set = taxLines().filter((l) => l.message === 'Stripe price tax behavior set');
    expect(set.map((l) => [l.level, l.context.stripe_price_id]).sort()).toEqual([
      ['info', 'price_m_unspecified'],
      ['info', 'price_py_unspecified'],
    ]);
    expect(set.find((l) => l.context.stripe_price_id === 'price_m_unspecified')!.context).toMatchObject({
      plan_id: 2,
      billing_type: 'MONTHLY',
      step: 'stripe-price-tax',
    });
    const warns = mockLines.filter((l) => l.level === 'warn');
    expect(warns).toHaveLength(1);
    expect(warns[0].message).toBe('Stripe price is tax-exclusive; left unchanged');
    expect(warns[0].context).toMatchObject({ plan_id: 2, billing_type: 'YEARLY', stripe_price_id: 'price_y_exclusive', step: 'stripe-price-tax' });
    expect(mockStripeState.taxBehavior.get('price_y_exclusive')).toBe('exclusive');
    // Nothing is re-priced: no new Stripe price and no new or retired row.
    expect(createdStripePrices()).toHaveLength(0);
    expect(prices()).toHaveLength(6);
    expect(prices().filter((p) => p.is_active).map((p) => p.id).sort()).toEqual([14, 21, 23, 31, 33]);
  });

  it('AC-23: retired prices are left alone (no tax read or update)', async () => {
    load(currentDb());
    setTax();
    await main();
    expect(taxUpdates().map(([id]) => id)).not.toContain('price_retired_unspecified');
    expect(taxLines().map((l) => l.context.stripe_price_id)).not.toContain('price_retired_unspecified');
    expect(mockStripeState.taxBehavior.has('price_retired_unspecified')).toBe(false);
  });

  it('AC-23: a re-run is idempotent: no tax update calls, only the exclusive warn again', async () => {
    load(currentDb());
    setTax();
    await main();
    reset();
    await main();
    expect(taxUpdates()).toEqual([]);
    expect(stripeCalls('prices.update')).toHaveLength(0);
    expect(mockLines.filter((l) => l.message === 'Stripe price tax behavior set')).toHaveLength(0);
    expect(mockLines.filter((l) => l.level === 'warn').map((l) => l.context.stripe_price_id)).toEqual(['price_y_exclusive']);
  });

  it('AC-6/AC-8: a no-op re-run after the legacy migration makes zero prices.update calls and logs no "Stripe price archived"', async () => {
    load(legacyDb({ backfilled: false }));
    await main();
    reset();
    await main();
    expect(stripeCalls('prices.update')).toHaveLength(0);
    expect(createdStripePrices()).toHaveLength(0);
    expect(mockLines.filter((l) => l.message === 'Stripe price archived')).toHaveLength(0);
    expect(mockLines.filter((l) => l.message === 'Stripe price archive failed')).toHaveLength(0);
  });
});

describe('plans seed: rounded yearly prices from the Addendum A state (Addendum B)', () => {
  /** The DB and Stripe as the Addendum A seed left them: active 57.6 / 86.4 yearly rows with inclusive prices. */
  const addendumADb = () => ({
    plans: [planRow(1, 'Artist', 'free', 'prod_free'), planRow(2, 'Artist Plus', 'plus', 'prod_plus'), planRow(3, 'Studio', 'pro', 'prod_pro')],
    plan_prices: [
      priceRow(14, 1, 'LIFETIME', 0, null),
      priceRow(21, 2, 'MONTHLY', 9, 'price_plus_m9', false),
      priceRow(25, 2, 'MONTHLY', 6, 'price_a_plus_m'),
      priceRow(26, 2, 'YEARLY', Math.fround(57.6), 'price_a_plus_y'),
      priceRow(35, 3, 'MONTHLY', 9, 'price_a_pro_m'),
      priceRow(36, 3, 'YEARLY', Math.fround(86.4), 'price_a_pro_y'),
    ],
    plan_translations: [],
  });
  const setStripe = () => {
    for (const id of ['price_a_plus_m', 'price_a_plus_y', 'price_a_pro_m', 'price_a_pro_y']) {
      mockStripeState.taxBehavior.set(id, 'inclusive');
    }
    mockStripeState.taxBehavior.set('price_plus_m9', 'unspecified');
    mockStripeState.archivedPrices.add('price_plus_m9');
  };
  const insertedPrices = () =>
    mockDb.ops.filter((o): o is Extract<Op, { type: 'insert' }> => o.type === 'insert' && o.table === 'plan_prices').map((o) => o.row);

  beforeEach(() => {
    load(addendumADb());
    setStripe();
  });

  it('AC-26: creates YEARLY 60 / 90 rows with inclusive Stripe prices of 6000 / 9000 cents, recurring year', async () => {
    await main();
    const created = createdStripePrices();
    expect(created).toHaveLength(2);
    expect(created.map((p) => [p.currency, p.unit_amount, p.recurring.interval, p.tax_behavior, p.metadata?.plan]).sort()).toEqual([
      ['eur', 6000, 'year', 'inclusive', 'plus'],
      ['eur', 9000, 'year', 'inclusive', 'pro'],
    ]);
    const inserted = insertedPrices();
    expect(inserted.map((r) => [r.plan_id, r.billing_type, r.price, r.is_active]).sort()).toEqual([
      [2, 'YEARLY', 60, true],
      [3, 'YEARLY', 90, true],
    ]);
    for (const r of inserted) expect(r.stripe_id).toMatch(/^price_new_/);
    expect(activePrices(1)).toEqual(['LIFETIME:0']);
    expect(activePrices(2)).toEqual(['MONTHLY:6', 'YEARLY:60']);
    expect(activePrices(3)).toEqual(['MONTHLY:9', 'YEARLY:90']);
  });

  it('AC-26/AC-8: the 57.6 / 86.4 rows are retired and kept unchanged, and their Stripe prices archived', async () => {
    await main();
    expect(prices().find((p) => p.id === 26)).toMatchObject({ is_active: false, price: Math.fround(57.6), stripe_id: 'price_a_plus_y' });
    expect(prices().find((p) => p.id === 36)).toMatchObject({ is_active: false, price: Math.fround(86.4), stripe_id: 'price_a_pro_y' });
    expect(prices()).toHaveLength(8);
    expect(archivedStripeIds().sort()).toEqual(['price_a_plus_y', 'price_a_pro_y']);
    const retired = mockLines.filter((l) => l.message === 'Plan price retired').map((l) => [l.context.plan_price_id, l.context.reason]);
    expect(retired.sort()).toEqual([
      [26, 'amount-changed'],
      [36, 'amount-changed'],
    ]);
    expect(mockLines.find((l) => l.message === 'Plans seed completed')!.context).toEqual({ plans: 3, prices_created: 2, prices_retired: 2 });
  });

  it('AC-26/AC-9: the new yearly row is inserted before the old one is retired; no write touches price/stripe_id of a row with a stripe_id', async () => {
    await main();
    for (const [oldId, planId] of [[26, 2], [36, 3]] as const) {
      const insertAt = mockDb.ops.findIndex((o) => o.type === 'insert' && o.table === 'plan_prices' && o.row.plan_id === planId);
      const retireAt = mockDb.ops.findIndex((o) => o.type === 'update' && o.table === 'plan_prices' && o.ids.includes(oldId));
      expect(insertAt).toBeGreaterThanOrEqual(0);
      expect(retireAt).toBeGreaterThan(insertAt);
    }
    const offending = mockDb.ops.filter(
      (o) => o.type === 'update' && o.table === 'plan_prices' && o.before.some((r) => r.stripe_id) && o.columns.some((c) => c === 'price' || c === 'stripe_id'),
    );
    expect(offending).toEqual([]);
  });

  it('AC-26: the unchanged MONTHLY rows and their inclusive prices are left alone (no tax update, no new price)', async () => {
    await main();
    expect(prices().find((p) => p.id === 25)).toMatchObject({ is_active: true, stripe_id: 'price_a_plus_m' });
    expect(prices().find((p) => p.id === 35)).toMatchObject({ is_active: true, stripe_id: 'price_a_pro_m' });
    expect(stripeCalls('prices.update').filter((c) => (c.args[1] as any)?.tax_behavior !== undefined)).toEqual([]);
    expect(mockLines.filter((l) => l.level === 'warn')).toHaveLength(0);
  });

  it('AC-26/AC-6: a second run creates and archives nothing', async () => {
    await main();
    const snapshot = JSON.parse(JSON.stringify(prices()));
    reset();
    mockDb.ops = [];
    await main();
    expect(createdStripePrices()).toHaveLength(0);
    expect(stripeCalls('prices.update')).toHaveLength(0);
    expect(prices()).toEqual(snapshot);
    expect(mockDb.ops.filter((o) => o.type === 'insert' && o.table === 'plan_prices')).toHaveLength(0);
    expect(mockLines.filter((l) => l.message === 'Stripe price archived')).toHaveLength(0);
    expect(mockLines.find((l) => l.message === 'Plans seed completed')!.context).toEqual({ plans: 3, prices_created: 0, prices_retired: 0 });
  });
});
