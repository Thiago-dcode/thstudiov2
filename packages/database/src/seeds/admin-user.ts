/**
 * Platform admin user (role `ADMIN`), with `user_extra_data`, free plan subscription, and Stripe customer.
 *
 * Mirrors {@link UserService.handleNewUserEvent} (Stripe + extra data) and
 * {@link PlanSubscriptionsService.setFreeSubscription} (free LIFETIME `plan_subscriptions` row).
 *
 * Prerequisites: run the default seed first (`pnpm dbcli db:seed`) so `roles` and `plans` exist.
 *
 * Usage:
 *   pnpm dbcli db:seed -n admin-user
 *
 * Required env (no defaults — the seed throws if any is unset):
 *   ADMIN_EMAIL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... pnpm dbcli db:seed -n admin-user
 *
 * Note: distinct from `ADMIN_EMAILS` (plural), which is the 500-alert recipient list.
 *
 * Re-running skips if the email or username is already taken.
 */

import { hash } from '@repo/common-lib/utils/hash';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { LogService } from '@repo/backend-lib/services/log-service';
import Logger from '@repo/backend-lib/utils/console';
import { randomUUID } from 'node:crypto';
import { requireEnv } from '@repo/common-lib/utils/require-env';
import { normalizeUsername } from '@repo/common-lib/utils/username';
import { Query } from '../lib/facades';

const ADMIN_EMAIL = requireEnv('ADMIN_EMAIL');
/** Same value used by `ADMIN_USERNAME`; exported for `main.ts` and other seeds that target the admin user. */
export const ADMIN_USERNAME = normalizeUsername(requireEnv('ADMIN_USERNAME'));
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');

export const main = async () => {
  const emailTaken = await Query.table(TABLES_ENUM.USERS)
    .where('email', '=', ADMIN_EMAIL)
    .exists();
  const usernameTaken = await Query.table(TABLES_ENUM.USERS)
    .where('username', '=', ADMIN_USERNAME)
    .exists();

  if (emailTaken || usernameTaken) {
    Logger.info(
      `Admin seed skipped: email or username already in use (${ADMIN_EMAIL} / ${ADMIN_USERNAME}).`,
    );
    await LogService.flush();
    return;
  }

  const adminRole = await Query.table(TABLES_ENUM.ROLES)
    .where('name', '=', 'ADMIN')
    .first<{ id: number }>();

  if (!adminRole) {
    throw new Error(
      'ADMIN role not found. Run the default seed (`pnpm dbcli db:seed`) first.',
    );
  }

  const lifetimePrice = await Query.table(TABLES_ENUM.PLAN_PRICES)
    .select(['plan_prices.id'])
    .join('plan_id', TABLES_ENUM.PLANS, 'id')
    .where('plans.is_free', '=', true)
    .where('billing_type', '=', 'LIFETIME')
    .first<{ id: number }>();

  if (!lifetimePrice) {
    throw new Error(
      'Free plan LIFETIME price not found. Run the default seed so plans are seeded.',
    );
  }

  let stripeCustomerId: string | null = null;
  try {
    const stripeCustomer = await stripe.customers.create({
      email: ADMIN_EMAIL,
      business_name: ADMIN_USERNAME,
    });
    stripeCustomerId = stripeCustomer.id;
    Logger.success(
      `Stripe customer created for admin seed: ${stripeCustomerId}`,
    );
  } catch (err) {
    Logger.warn(
      'Stripe customer creation failed; user will have null stripe_customer_id. Fix Stripe env or run the create-stripe-customers script after seeding.',
    );
    console.warn(err);
  }

  const passwordHash = await hash(ADMIN_PASSWORD);

  const userRow: Record<string, string | number | boolean | null> = {
    public_id: randomUUID(),
    name: 'Admin',
    surname: null,
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    stripe_customer_id: stripeCustomerId,
    password: passwordHash,
    biography: null,
    profession: null,
    short_biography: null,
    email_validated: true,
    is_active: true,
    banned: false,
    banned_reason: null,
    funnel_step: 1,
    number_email_validations_sent: 0,
    twofa_enabled: false,
    twofa_code: null,
    twofa_expires_at: null,
    twofa_attempts: 0,
    username_reset_count: 0,
    password_reset_count: 0,
    next_username_reset: null,
    next_password_reset: null,
    role_id: adminRole.id,
  };

  const { id: userId } = await Query.table(TABLES_ENUM.USERS).insertAndGet(
    Object.keys(userRow),
    Object.values(userRow),
    ['id'],
  );

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await Query.table(TABLES_ENUM.USER_EXTRA_DATA).insert(
    ['user_id', 'next_ai_credits_reset'],
    [userId, nextMonth],
  );

  const now = new Date();
  const nextBillingDate = new Date(now);
  nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 10);

  await Query.table(TABLES_ENUM.PLAN_SUBSCRIPTIONS).insert(
    [
      'is_active',
      'is_trialing',
      'amount',
      'payment_method',
      'start_billing_date',
      'next_billing_date',
      'user_id',
      'stripe_id',
      'stripe_item_id',
      'auto_renewal',
      'cancel_at',
      'paypal_id',
      'plan_offer_id',
      'prev_subscription_id',
      'plan_price_id',
    ],
    [
      true,
      false,
      0,
      'CARD',
      now,
      nextBillingDate,
      userId,
      null,
      null,
      true,
      null,
      null,
      null,
      null,
      lifetimePrice.id,
    ],
  );

  Logger.success(
    `Admin user seeded: id=${userId} email=${ADMIN_EMAIL} username=${ADMIN_USERNAME}`,
  );
  await LogService.flush();
};
