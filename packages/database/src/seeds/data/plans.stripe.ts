import type { stripe as stripeClient } from '@repo/backend-lib/services/payment-service/stripe';
import { maskEmailAddresses } from '@repo/backend-lib/services/log-service';
import { EnumType } from '@repo/common-lib/constants/enums';
import { toMinorUnits } from '@repo/common-lib/utils/calculatePrice';
import type { DbcliLogger } from '../../bin/dbcli-audit';
import { stripeRecurringFor } from './plans';

/** The slice of the Stripe client the plans seed uses. Injected so tests can pass a fake. */
export type PlanStripeClient = Pick<typeof stripeClient, 'products' | 'prices'>;
export type PlanSeedLogger = Pick<DbcliLogger, 'info' | 'warn' | 'error'>;

const MAX_ERROR_MESSAGE = 200;

const errorName = (error: unknown) => (error instanceof Error ? error.name : typeof error);

const isResourceMissing = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'resource_missing';

/**
 * The Stripe steps of the plans seed. Stripe prices are immutable, so an amount change is a new
 * price plus an archive of the old one; the seed decides when, these only make the calls.
 */
export function planStripeSteps(stripe: PlanStripeClient, log: PlanSeedLogger) {
  /**
   * Updates the plan's product by id. Recreates it only when Stripe no longer has it; any other
   * error is thrown, so a transient failure never leaves the plan pointing at a duplicate.
   */
  async function upsertStripeProduct(input: {
    plan_id: number;
    stripe_product_id: string | null;
    name: string;
    description: string;
  }): Promise<string> {
    const { plan_id, stripe_product_id, name, description } = input;
    if (stripe_product_id) {
      try {
        const updated = await stripe.products.update(stripe_product_id, { name, description, active: true });
        log.info('Stripe product upserted', {
          plan_id,
          stripe_product_id: updated.id,
          created: false,
          step: 'stripe-product',
        });
        return updated.id;
      } catch (error) {
        if (!isResourceMissing(error)) throw error;
        log.error('Stripe product missing; recreating', {
          plan_id,
          stripe_product_id,
          error_name: errorName(error),
          step: 'stripe-product',
        });
      }
    }
    const created = await stripe.products.create({ active: true, name, description });
    log.info('Stripe product upserted', {
      plan_id,
      stripe_product_id: created.id,
      created: true,
      step: 'stripe-product',
    });
    return created.id;
  }

  async function createStripePrice(input: {
    plan_id: number;
    stripe_product_id: string;
    unique_identifier: string;
    billing_type: EnumType<'BILLING_TYPE'>;
    amount: number;
  }): Promise<string> {
    const { plan_id, stripe_product_id, unique_identifier, billing_type, amount } = input;
    const unit_amount = toMinorUnits(amount);
    const created = await stripe.prices.create({
      product: stripe_product_id,
      currency: 'eur',
      unit_amount,
      recurring: stripeRecurringFor(billing_type),
      // Prices are VAT-inclusive (€6 is what the customer pays). Explicit, so it never depends on
      // the account's dashboard default, which test and live mode set separately.
      tax_behavior: 'inclusive',
      metadata: { plan: unique_identifier, billing_type },
    });
    log.info('Stripe price created', {
      plan_id,
      billing_type,
      stripe_price_id: created.id,
      unit_amount,
      step: 'stripe-price-create',
    });
    return created.id;
  }

  /**
   * Makes an existing active price VAT-inclusive. Stripe lets `tax_behavior` be set once, from
   * `unspecified`; a price that is already `exclusive` is never re-priced, only reported.
   */
  async function ensureInclusiveTax(input: {
    plan_id: number;
    billing_type: EnumType<'BILLING_TYPE'>;
    stripe_price_id: string;
  }): Promise<void> {
    const { plan_id, billing_type, stripe_price_id } = input;
    const current = await stripe.prices.retrieve(stripe_price_id);
    if (current.tax_behavior === 'unspecified') {
      await stripe.prices.update(stripe_price_id, { tax_behavior: 'inclusive' });
      log.info('Stripe price tax behavior set', {
        plan_id,
        billing_type,
        stripe_price_id,
        tax_behavior: 'inclusive',
        step: 'stripe-price-tax',
      });
    } else if (current.tax_behavior === 'exclusive') {
      log.warn('Stripe price is tax-exclusive; left unchanged', {
        plan_id,
        billing_type,
        stripe_price_id,
        step: 'stripe-price-tax',
      });
    }
  }

  /**
   * Archives a retired price so nobody new can be billed on it. Existing subscriptions keep it.
   * Never throws: the row is already retired, and a re-run archives it again.
   *
   * `onlyIfActive` (the re-run heal pass) first reads the price and skips one Stripe already has
   * archived, so a re-run neither writes nor logs anything for it.
   */
  async function archiveStripePrice(
    stripe_price_id: string,
    options: { onlyIfActive?: boolean } = {},
  ): Promise<boolean> {
    try {
      if (options.onlyIfActive) {
        const current = await stripe.prices.retrieve(stripe_price_id);
        if (!current.active) return true;
      }
      await stripe.prices.update(stripe_price_id, { active: false });
      log.info('Stripe price archived', { stripe_price_id, step: 'stripe-price-archive' });
      return true;
    } catch (error) {
      log.error('Stripe price archive failed', {
        stripe_price_id,
        error_name: errorName(error),
        error_message: maskEmailAddresses(error instanceof Error ? error.message : String(error)).slice(
          0,
          MAX_ERROR_MESSAGE,
        ),
        step: 'stripe-price-archive',
      });
      return false;
    }
  }

  return { upsertStripeProduct, createStripePrice, ensureInclusiveTax, archiveStripePrice };
}
