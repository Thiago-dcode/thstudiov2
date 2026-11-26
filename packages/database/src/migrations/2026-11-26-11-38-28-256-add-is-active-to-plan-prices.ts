import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter, Schema } from '../lib/facades';

const PLAN_PRICES = TABLES_ENUM.PLAN_PRICES;

/**
 * Whether a price can still be bought.
 *
 * `plan_prices` rows are never deleted: `plan_subscriptions` reference them, and Stripe
 * webhooks resolve existing subscribers through their `stripe_id`. A retired price (a dropped
 * billing period, or an amount that changed) is kept with `is_active = false` instead.
 */
const up = async () => {
  await Schema.raw(`
    ALTER TABLE ${PLAN_PRICES}
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
  `);
};

const down = async () => {
  await Alter.table(PLAN_PRICES).dropColumnIfExists('is_active');
};

export { up, down };
