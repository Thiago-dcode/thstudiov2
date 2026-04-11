import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import Logger from '@repo/backend-lib/utils/console';
import { connectDb } from './utils';
import { Query } from '../facades';
import { killClient } from '../client';

const createStripeCustomers = async () => {
  const start = Date.now();
  try {
    await connectDb();
    Logger.info('🔄 Fetching active users without Stripe customer ID...');

    const users = await Query.table('users')
      .where('is_active', '=', true)
      .where('stripe_customer_id', '=', null)
      .get();

    Logger.info(`Found ${users.length} users to process.`);

    let created = 0;
    let errors = 0;

    for (const user of users) {
      try {
        Logger.info(`Processing user ${user.email} [${user.id}]...`);

    
        const customerParams: any = {
             email: user.email,
             name: user.username,
        };

        const customer = await stripe.customers.create(customerParams);

        await Query.table('users')
          .where('id', '=', user.id)
          .update(['stripe_customer_id'], [customer.id]);

        Logger.success(`  ✓ Created Stripe customer ${customer.id} for user ${user.id}`);
        created++;
      } catch (err) {
        Logger.error(`  ❌ Failed to create Stripe customer for user ${user.id}:`, err);
        errors++;
      }
    }

    Logger.success(
      `✅ Completed. Created: ${created}, Errors: ${errors}. Time: ${((Date.now() - start) / 1000).toFixed(2)}s`,
    );
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await killClient();
  }
};

export { createStripeCustomers };
