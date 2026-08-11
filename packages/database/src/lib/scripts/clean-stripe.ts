import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import Logger from '@repo/backend-lib/utils/console';
import { connectDb } from './utils';
import { Query } from '../facades';
import { killClient } from '../client';
import {
  DESTRUCTIVE_PASSWORD_ENV,
  verifyDestructivePassword,
} from './utils/destructive-password';

const assertDestructivePassword = (password: string, shouldExit: boolean) => {
  if (!verifyDestructivePassword(password)) {
    Logger.error(
      `❌ Invalid password (check ${DESTRUCTIVE_PASSWORD_ENV}). Refusing Stripe cleanup.`,
    );
    if (shouldExit) process.exit(1);
    throw new Error('Invalid destructive-action password');
  }
};

const deleteAllStripeSubscriptions = async () => {
  Logger.info('🔄 Deleting all Stripe subscriptions...');
  let deleted = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Record<string, any> = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const subscriptions = await stripe.subscriptions.list(params);

    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id, {
        prorate: false,
      });

      await Query.table('plan_subscriptions')
        .where('stripe_id', '=', subscription.id)
        .update(['stripe_id', 'stripe_item_id'], [null, null]);

      deleted++;
      Logger.info(`  ✕ Cancelled subscription ${subscription.id}`);
    }

    hasMore = subscriptions.has_more;
    if (subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1]!.id;
    }
  }

  Logger.success(`✅ Deleted ${deleted} Stripe subscriptions`);
};

const deleteAllStripeCustomers = async () => {
  Logger.info('🔄 Deleting all Stripe customers...');
  let deleted = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Record<string, any> = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const customers = await stripe.customers.list(params);

    for (const customer of customers.data) {
      await stripe.customers.del(customer.id);

      await Query.table('users')
        .where('stripe_customer_id', '=', customer.id)
        .update(['stripe_customer_id'], [null]);

      deleted++;
      Logger.info(`  ✕ Deleted customer ${customer.id}`);
    }

    hasMore = customers.has_more;
    if (customers.data.length > 0) {
      startingAfter = customers.data[customers.data.length - 1]!.id;
    }
  }

  Logger.success(`✅ Deleted ${deleted} Stripe customers`);
};

const deleteAllStripePrices = async () => {
  Logger.info('🔄 Archiving all Stripe prices...');
  let archived = 0;

  // Re-list active prices until none remain (avoids pagination gaps while mutating)
  let batch = await stripe.prices.list({ limit: 100, active: true });
  while (batch.data.length > 0) {
    for (const price of batch.data) {
      await stripe.prices.update(price.id, { active: false });
      archived++;
      Logger.info(`  ✕ Archived price ${price.id}`);
    }
    batch = await stripe.prices.list({ limit: 100, active: true });
  }

  Logger.success(`✅ Archived ${archived} Stripe prices`);
};

/**
 * Stripe does not allow deleting products that have prices (prices are only archivable).
 * Deactivating products matches price cleanup and unblocks re-seeding with new catalog IDs.
 */
const archiveAllStripeProducts = async () => {
  Logger.info('🔄 Archiving all Stripe products...');
  let archived = 0;

  let batch = await stripe.products.list({ limit: 100, active: true });
  while (batch.data.length > 0) {
    for (const product of batch.data) {
      await stripe.products.update(product.id, { active: false });
      archived++;
      Logger.info(`  ✕ Archived product ${product.id}`);
    }
    batch = await stripe.products.list({ limit: 100, active: true });
  }

  Logger.success(`✅ Archived ${archived} Stripe products`);
};

const deleteAllProducts = async () => {
  await deleteAllStripePrices();
  await archiveAllStripeProducts();

  await Query.table('plan_prices').update(['stripe_id'], [null]);
  await Query.table('plans').update(['stripe_id'], [null]);
  Logger.success('✅ Cleared plan and plan_price stripe_id in database');
};

export type CleanStripeOptions = { exitProcess?: boolean; password: string };

const cleanStripe = async (options: CleanStripeOptions) => {
  const shouldExit = options.exitProcess !== false;
  const start = Date.now();
  try {
    assertDestructivePassword(options.password, shouldExit);
    await connectDb();

    await deleteAllStripeSubscriptions();
    await deleteAllStripeCustomers();
    await deleteAllProducts();

    Logger.success(
      `✅ Stripe cleanup completed in ${((Date.now() - start) / 1000).toFixed(2)}s`,
    );
    if (shouldExit) process.exit(0);
  } catch (error) {
    Logger.error('❌ Stripe cleanup failed:', error);
    if (shouldExit) process.exit(1);
    throw error;
  } finally {
    await killClient();
  }
};

export { cleanStripe };
