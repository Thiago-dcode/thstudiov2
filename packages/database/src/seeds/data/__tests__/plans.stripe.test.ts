jest.mock('@repo/common-lib/config', () => ({ config: () => ({ redis: { url: 'redis://stub' } }) }));

import { planStripeSteps, PlanStripeClient } from '../plans.stripe';

const STRIPE_KEY = 'sk_test_SUPERSECRETKEY';

const fakeStripe = () => {
  const stripe = {
    products: {
      update: jest.fn(async (id: string) => ({ id, object: 'product', name: 'x' })),
      create: jest.fn(async () => ({ id: 'prod_new', object: 'product' })),
    },
    prices: {
      create: jest.fn(async () => ({ id: 'price_new', object: 'price', unit_amount: 0 })),
      update: jest.fn(async (id: string) => ({ id, object: 'price', active: false })),
      retrieve: jest.fn(async (id: string) => ({ id, object: 'price', active: true, tax_behavior: 'unspecified' })),
    },
  };
  return stripe;
};

const capturingLogger = () => {
  const lines: { level: 'info' | 'warn' | 'error'; message: string; context: Record<string, unknown> }[] = [];
  const log = {
    info: jest.fn((message: string, context: Record<string, unknown>) => lines.push({ level: 'info', message, context })),
    warn: jest.fn((message: string, context: Record<string, unknown>) => lines.push({ level: 'warn', message, context })),
    error: jest.fn((message: string, context: Record<string, unknown>) => lines.push({ level: 'error', message, context })),
  };
  return { log, lines };
};

const stripeError = (code: string, message = 'No such product: prod_old') =>
  Object.assign(new Error(message), {
    name: 'StripeInvalidRequestError',
    type: 'StripeInvalidRequestError',
    code,
    statusCode: 404,
    raw: { code, headers: { authorization: `Bearer ${STRIPE_KEY}` } },
  });

const build = () => {
  const stripe = fakeStripe();
  const { log, lines } = capturingLogger();
  const steps = planStripeSteps(stripe as unknown as PlanStripeClient, log as any);
  return { stripe, log, lines, steps };
};

describe('planStripeSteps.createStripePrice', () => {
  it('AC-26: YEARLY 60 sends eur, unit_amount 6000, recurring year and inclusive tax, with plan metadata', async () => {
    const { stripe, steps, lines } = build();
    const id = await steps.createStripePrice({
      plan_id: 2,
      stripe_product_id: 'prod_plus',
      unique_identifier: 'plus',
      billing_type: 'YEARLY',
      amount: 60,
    });
    expect(id).toBe('price_new');
    expect(stripe.prices.create).toHaveBeenCalledTimes(1);
    expect(stripe.prices.create).toHaveBeenCalledWith({
      product: 'prod_plus',
      currency: 'eur',
      unit_amount: 6000,
      recurring: { interval: 'year' },
      tax_behavior: 'inclusive',
      metadata: { plan: 'plus', billing_type: 'YEARLY' },
    });
    expect(lines).toEqual([
      {
        level: 'info',
        message: 'Stripe price created',
        context: {
          plan_id: 2,
          billing_type: 'YEARLY',
          stripe_price_id: 'price_new',
          unit_amount: 6000,
          step: 'stripe-price-create',
        },
      },
    ]);
  });

  it.each([
    ['MONTHLY', 6, 600, 'month'],
    ['YEARLY', 60, 6000, 'year'],
    ['MONTHLY', 9, 900, 'month'],
    ['YEARLY', 90, 9000, 'year'],
  ] as const)('AC-7: %s %s -> unit_amount %s, interval %s', async (billing_type, amount, unit_amount, interval) => {
    const { stripe, steps } = build();
    await steps.createStripePrice({ plan_id: 1, stripe_product_id: 'prod', unique_identifier: 'pro', billing_type, amount });
    expect(stripe.prices.create.mock.calls[0][0]).toMatchObject({ currency: 'eur', unit_amount, recurring: { interval } });
  });

  it('AC-7: refuses to create a Stripe price for QUARTERLY or LIFETIME', async () => {
    const { stripe, steps } = build();
    for (const billing_type of ['QUARTERLY', 'LIFETIME'] as const) {
      await expect(
        steps.createStripePrice({ plan_id: 1, stripe_product_id: 'prod', unique_identifier: 'pro', billing_type, amount: 9 }),
      ).rejects.toThrow();
    }
    expect(stripe.prices.create).not.toHaveBeenCalled();
  });
});

describe('planStripeSteps.archiveStripePrice', () => {
  it('AC-8: archives with active:false and logs one info line', async () => {
    const { stripe, steps, lines } = build();
    await expect(steps.archiveStripePrice('price_old')).resolves.toBe(true);
    expect(stripe.prices.update).toHaveBeenCalledWith('price_old', { active: false });
    expect(lines).toEqual([
      { level: 'info', message: 'Stripe price archived', context: { stripe_price_id: 'price_old', step: 'stripe-price-archive' } },
    ]);
  });

  it('AC-22: a failed archive logs exactly one error line with step, stripe_price_id and error_name, and does not throw', async () => {
    const { stripe, steps, lines } = build();
    stripe.prices.update.mockRejectedValueOnce(stripeError('resource_missing', 'No such price: price_old'));
    await expect(steps.archiveStripePrice('price_old')).resolves.toBe(false);
    const errors = lines.filter((l) => l.level === 'error');
    expect(errors).toHaveLength(1);
    expect(lines).toHaveLength(1);
    expect(errors[0].message).toBe('Stripe price archive failed');
    expect(errors[0].context).toMatchObject({
      stripe_price_id: 'price_old',
      error_name: 'StripeInvalidRequestError',
      step: 'stripe-price-archive',
    });
  });

  it('AC-22: the failure line contains no Stripe key, no raw error object, and a masked message of at most 200 chars', async () => {
    const { stripe, steps, lines } = build();
    const long = `Request failed for owner victim@example.com ${'x'.repeat(400)}`;
    stripe.prices.update.mockRejectedValueOnce(stripeError('api_error', long));
    await steps.archiveStripePrice('price_old');
    const dumped = JSON.stringify(lines);
    expect(dumped).not.toContain(STRIPE_KEY);
    expect(dumped).not.toMatch(/authorization|"raw"|"headers"/);
    expect(dumped).not.toContain('victim@example.com');
    const message = lines[0].context.error_message as string;
    expect(typeof message).toBe('string');
    expect(message.length).toBeLessThanOrEqual(200);
  });
});

describe('planStripeSteps.upsertStripeProduct', () => {
  const input = { plan_id: 3, stripe_product_id: 'prod_old', name: 'Studio', description: 'desc' };

  it('AC-4: updates the existing product by id (name + description) and never creates one', async () => {
    const { stripe, steps, lines } = build();
    await expect(steps.upsertStripeProduct(input)).resolves.toBe('prod_old');
    expect(stripe.products.update).toHaveBeenCalledWith('prod_old', expect.objectContaining({ name: 'Studio', description: 'desc' }));
    expect(stripe.products.create).not.toHaveBeenCalled();
    expect(lines).toEqual([
      {
        level: 'info',
        message: 'Stripe product upserted',
        context: { plan_id: 3, stripe_product_id: 'prod_old', created: false, step: 'stripe-product' },
      },
    ]);
  });

  it('AC-22: recreates the product only on resource_missing, logging one error then one info line', async () => {
    const { stripe, steps, lines } = build();
    stripe.products.update.mockRejectedValueOnce(stripeError('resource_missing'));
    await expect(steps.upsertStripeProduct(input)).resolves.toBe('prod_new');
    expect(stripe.products.create).toHaveBeenCalledTimes(1);
    expect(stripe.products.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Studio', description: 'desc' }));
    expect(lines.map((l) => [l.level, l.message])).toEqual([
      ['error', 'Stripe product missing; recreating'],
      ['info', 'Stripe product upserted'],
    ]);
    expect(lines[0].context).toMatchObject({
      plan_id: 3,
      stripe_product_id: 'prod_old',
      error_name: 'StripeInvalidRequestError',
      step: 'stripe-product',
    });
    expect(lines[1].context).toMatchObject({ stripe_product_id: 'prod_new', created: true });
    expect(JSON.stringify(lines)).not.toContain(STRIPE_KEY);
  });

  it('AC-22: any other Stripe error is rethrown and nothing is created', async () => {
    const { stripe, steps } = build();
    const err = stripeError('rate_limit', 'Too many requests');
    stripe.products.update.mockRejectedValueOnce(err);
    await expect(steps.upsertStripeProduct(input)).rejects.toBe(err);
    expect(stripe.products.create).not.toHaveBeenCalled();
  });

  it('AC-4: a plan with no product yet gets one created', async () => {
    const { stripe, steps } = build();
    await expect(steps.upsertStripeProduct({ ...input, stripe_product_id: null })).resolves.toBe('prod_new');
    expect(stripe.products.update).not.toHaveBeenCalled();
  });
});

describe('planStripeSteps.ensureInclusiveTax (Addendum A)', () => {
  const input = { plan_id: 2, billing_type: 'MONTHLY' as const, stripe_price_id: 'price_m' };
  const withTax = (tax_behavior: string) => {
    const b = build();
    b.stripe.prices.retrieve.mockResolvedValue({ id: 'price_m', object: 'price', active: true, tax_behavior });
    return b;
  };

  it('AC-23: unspecified -> prices.update(id, { tax_behavior: inclusive }) and one info line', async () => {
    const { stripe, steps, lines } = withTax('unspecified');
    await steps.ensureInclusiveTax(input);
    expect(stripe.prices.retrieve).toHaveBeenCalledWith('price_m');
    expect(stripe.prices.update).toHaveBeenCalledTimes(1);
    expect(stripe.prices.update).toHaveBeenCalledWith('price_m', { tax_behavior: 'inclusive' });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: 'info',
      message: 'Stripe price tax behavior set',
      context: { plan_id: 2, billing_type: 'MONTHLY', stripe_price_id: 'price_m', step: 'stripe-price-tax' },
    });
  });

  it('AC-23: exclusive -> one warn line and no update (never silently re-priced)', async () => {
    const { stripe, steps, lines } = withTax('exclusive');
    await steps.ensureInclusiveTax(input);
    expect(stripe.prices.update).not.toHaveBeenCalled();
    expect(lines).toEqual([
      {
        level: 'warn',
        message: 'Stripe price is tax-exclusive; left unchanged',
        context: { plan_id: 2, billing_type: 'MONTHLY', stripe_price_id: 'price_m', step: 'stripe-price-tax' },
      },
    ]);
  });

  it('AC-23: inclusive -> no update call and no line (idempotent)', async () => {
    const { stripe, steps, lines } = withTax('inclusive');
    await steps.ensureInclusiveTax(input);
    await steps.ensureInclusiveTax(input);
    expect(stripe.prices.update).not.toHaveBeenCalled();
    expect(lines).toEqual([]);
  });

  it('AC-23: createStripePrice always sends tax_behavior inclusive', async () => {
    const { stripe, steps } = build();
    await steps.createStripePrice({ plan_id: 3, stripe_product_id: 'prod', unique_identifier: 'pro', billing_type: 'MONTHLY', amount: 9 });
    expect(stripe.prices.create.mock.calls[0][0]).toMatchObject({ tax_behavior: 'inclusive' });
  });

  it('AC-23: a Stripe error on the read is rethrown (no update, no log of the error object)', async () => {
    const { stripe, steps, lines } = build();
    const err = stripeError('api_error', 'boom');
    stripe.prices.retrieve.mockRejectedValueOnce(err);
    await expect(steps.ensureInclusiveTax(input)).rejects.toBe(err);
    expect(stripe.prices.update).not.toHaveBeenCalled();
    expect(JSON.stringify(lines)).not.toContain(STRIPE_KEY);
  });
});
