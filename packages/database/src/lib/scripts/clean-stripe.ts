import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { getConfigValue } from '@repo/common-lib/config/utils';
import Logger from '@repo/backend-lib/utils/console';
import { connectDb } from './utils';
import { Query } from '../facades';
import { killClient } from '../client';

const ALLOWED_ENVS = ['development', 'local', 'test'];

const assertLocalEnvironment = () => {
  const env = getConfigValue('app').env.toLowerCase();
  if (!ALLOWED_ENVS.includes(env)) {
    Logger.error(
      `❌ This script can only be run in local environments (${ALLOWED_ENVS.join(', ')}). Current: "${env}"`,
    );
    process.exit(1);
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



const cleanStripe = async () => {
  const start = Date.now();
  try {
    assertLocalEnvironment();
    await connectDb();

    await deleteAllStripeSubscriptions();
    await deleteAllStripeCustomers();

    Logger.success(
      `✅ Stripe cleanup completed in ${((Date.now() - start) / 1000).toFixed(2)}s`,
    );
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Stripe cleanup failed:', error);
    process.exit(1);
  } finally {
    await killClient();
  }
};

export { cleanStripe };
