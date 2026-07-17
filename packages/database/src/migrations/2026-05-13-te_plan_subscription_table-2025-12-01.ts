import { Column, Schema } from '../lib/facades';

const up = async () => {

  await Schema.table('plan_subscriptions').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('stripe_id', 255, {
      unique: true,
      nullable: true,
    }),
    Column.string('stripe_item_id', 255, {
      unique: true,
      nullable: true,
    }),
    Column.string('paypal_id', 255, {
      unique: true,
      nullable: true,
    }),
    Column.enum('payment_method', 'PAYMENT_METHOD'),
    Column.float('amount'),
    Column.timestamp('start_billing_date', {
      default: 'NOW()'
    }),
    Column.timestamp('next_billing_date'),

    Column.boolean('auto_renewal', {
      default: true
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'SET NULL',
    }),
    Column.foreignKey('prev_subscription_id', 'plan_subscriptions', 'id', {
      onDelete: 'SET NULL',
      nullable: true,
      unique: true,
    }),
    Column.foreignKey('plan_price_id', 'plan_prices', 'id', {
      onDelete: 'SET NULL',
    }),
    Column.foreignKey('plan_offer_id', 'plan_offers', 'id', {
      onDelete: 'SET NULL',
      nullable: true,
    }),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.boolean('is_trialing', {
      default: false,
    }),
    Column.timestamp('trialing_ends_at', {
      nullable: true,
    }),
    Column.timestamp('cancel_at', {
      nullable: true,
    }),
  ]);
};

const down = async () => {

  await Schema.table('plan_subscriptions').dropIfExists();


};

export { up, down };
