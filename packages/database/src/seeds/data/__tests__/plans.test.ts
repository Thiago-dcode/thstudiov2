import { PLAN_IDENTIFIERS } from '@repo/common-lib/constants/plan';
import { toMinorUnits } from '@repo/common-lib/utils/calculatePrice';
import { PAID_YEARLY_MONTHS_CHARGED, PLAN_DEFINITIONS, stripeRecurringFor } from '../plans';

const round2 = (n: number) => Math.round(n * 100) / 100;
const byKey = (key: string) => {
  const definition = PLAN_DEFINITIONS.find((d) => d.unique_identifier === key);
  if (!definition) throw new Error(`no definition ${key}`);
  return definition;
};
const amount = (key: string, billingType: string) =>
  byKey(key).prices.find((p) => p.billing_type === billingType)?.price;

// The *Seed data* table of the plan, verbatim.
const TABLE = {
  free: {
    legacy_name: 'Beginner',
    name: 'Artist',
    base_price: 0,
    is_free: true,
    is_popular: false,
    top_tier: false,
    storage_limit_mb: 10240,
    max_portfolios: 3,
    max_services: 3,
    max_collections: 3,
    max_projects: -1,
    max_clients: -1,
    ai_credits: 20,
    limit_write_storage_per_day: 50,
    allow_media_compression: false,
    logo: '/plans/beginner',
  },
  plus: {
    legacy_name: 'Freelancer',
    name: 'Artist Plus',
    base_price: 6,
    is_free: false,
    is_popular: true,
    top_tier: false,
    storage_limit_mb: 102400,
    max_portfolios: 5,
    max_services: 5,
    max_collections: 10,
    max_projects: -1,
    max_clients: -1,
    ai_credits: 200,
    limit_write_storage_per_day: 150,
    allow_media_compression: true,
    logo: '/plans/freelancer',
  },
  pro: {
    legacy_name: 'Studio',
    name: 'Studio',
    base_price: 9,
    is_free: false,
    is_popular: false,
    top_tier: true,
    storage_limit_mb: 256000,
    max_portfolios: -1,
    max_services: -1,
    max_collections: -1,
    max_projects: -1,
    max_clients: -1,
    ai_credits: 400,
    limit_write_storage_per_day: 300,
    allow_media_compression: true,
    logo: '/plans/professional',
  },
} as const;

const TRANSLATED_NAMES = {
  free: { EN: 'Artist', ES: 'Artista', PT: 'Artista' },
  plus: { EN: 'Artist Plus', ES: 'Artista Plus', PT: 'Artista Plus' },
  pro: { EN: 'Studio', ES: 'Estudio', PT: 'Estúdio' },
} as const;

describe('PLAN_DEFINITIONS (seed data)', () => {
  it('AC-4/AC-5: unique_identifiers are unique and equal PLAN_IDENTIFIERS, in order', () => {
    const keys = PLAN_DEFINITIONS.map((d) => d.unique_identifier);
    expect(keys).toEqual([...PLAN_IDENTIFIERS]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(Object.entries(TABLE))('AC-4: "%s" matches the limits table', (key, expected) => {
    expect(byKey(key)).toMatchObject(expected);
    expect(byKey(key).is_active).toBe(true);
  });

  it('AC-4: plan names and logos are unique (plans.name / plans.logo are UNIQUE)', () => {
    expect(new Set(PLAN_DEFINITIONS.map((d) => d.name)).size).toBe(3);
    expect(new Set(PLAN_DEFINITIONS.map((d) => d.logo)).size).toBe(3);
  });

  it.each(Object.entries(TRANSLATED_NAMES))('AC-4: "%s" has EN/ES/PT translations with the planned names', (key, names) => {
    const definition = byKey(key);
    const codes = definition.translations.map((t) => t.language_code).sort();
    expect(codes).toEqual(['EN', 'ES', 'PT']);
    for (const t of definition.translations) {
      expect(t.name).toBe(names[t.language_code as keyof typeof names]);
      expect(t.short_description).toBeTruthy();
      expect(t.description).toBeTruthy();
    }
    // plans.name / short_description / description (and the Stripe product) use the EN copy.
    const en = definition.translations.find((t) => t.language_code === 'EN')!;
    expect(definition.name).toBe(en.name);
    expect(definition.short_description).toBe(en.short_description);
    expect(definition.description).toBe(en.description);
  });

  it('AC-7: the free plan declares exactly LIFETIME 0', () => {
    expect(byKey('free').prices).toEqual([{ billing_type: 'LIFETIME', price: 0 }]);
  });

  it('AC-7: paid plans declare exactly MONTHLY and YEARLY with the planned amounts', () => {
    expect(byKey('plus').prices).toEqual([
      { billing_type: 'MONTHLY', price: 6 },
      { billing_type: 'YEARLY', price: 60 },
    ]);
    expect(byKey('pro').prices).toEqual([
      { billing_type: 'MONTHLY', price: 9 },
      { billing_type: 'YEARLY', price: 90 },
    ]);
  });

  it('AC-7: no plan declares a QUARTERLY price, and no billing type twice', () => {
    for (const d of PLAN_DEFINITIONS) {
      const types = d.prices.map((p) => p.billing_type);
      expect(types).not.toContain('QUARTERLY');
      expect(new Set(types).size).toBe(types.length);
    }
  });

  it('AC-26: YEARLY === 10 x MONTHLY for every paid plan (2 months free)', () => {
    expect(PAID_YEARLY_MONTHS_CHARGED).toBe(10);
    for (const d of PLAN_DEFINITIONS.filter((p) => !p.is_free)) {
      const monthly = amount(d.unique_identifier, 'MONTHLY')!;
      const yearly = amount(d.unique_identifier, 'YEARLY')!;
      expect(yearly).toBe(round2(PAID_YEARLY_MONTHS_CHARGED * monthly));
      expect(yearly).toBe(10 * monthly);
    }
  });

  it('AC-10: base_price equals the MONTHLY amount for paid plans', () => {
    for (const d of PLAN_DEFINITIONS.filter((p) => !p.is_free)) {
      expect(d.base_price).toBe(amount(d.unique_identifier, 'MONTHLY'));
    }
  });

  it('AC-7/AC-10: the declared amounts convert to the exact Stripe minor units', () => {
    expect(toMinorUnits(amount('plus', 'MONTHLY')!)).toBe(600);
    expect(toMinorUnits(amount('plus', 'YEARLY')!)).toBe(6000);
    expect(toMinorUnits(amount('pro', 'MONTHLY')!)).toBe(900);
    expect(toMinorUnits(amount('pro', 'YEARLY')!)).toBe(9000);
  });

  it('AC-10: the data file is not a seed (no main export)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../plans');
    expect(mod.main).toBeUndefined();
  });
});

describe('stripeRecurringFor', () => {
  it('AC-7: MONTHLY -> month, YEARLY -> year', () => {
    expect(stripeRecurringFor('MONTHLY')).toEqual({ interval: 'month' });
    expect(stripeRecurringFor('YEARLY')).toEqual({ interval: 'year' });
  });

  it('AC-7: throws for QUARTERLY and LIFETIME (never sold through Stripe)', () => {
    expect(() => stripeRecurringFor('QUARTERLY')).toThrow();
    expect(() => stripeRecurringFor('LIFETIME')).toThrow();
  });
});
