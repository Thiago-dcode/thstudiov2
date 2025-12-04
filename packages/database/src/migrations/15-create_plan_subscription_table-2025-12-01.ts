import { Alter, Column, Query, Schema } from "src/lib/facades";

const up = async () => {

  await Schema.table('plan_subscriptions').createIfNotExists([
    Column.id(),
    Column.string('stripe_id', 255, {
      unique: true,
      nullable:true,
    }),
    Column.string('paypal_id', 255, {
      unique: true,
      nullable:true,
    }),
    Column.timestamp('start_date',{
      default:'NOW()'
    }),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
    Column.foreignKey('plan_price_id', 'plan_prices', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
    Column.foreignKey('plan_transaction_id', 'user_plan_transactions', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      type:'BIGINT'
    }),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.timestamps(true),
  ]);

  await Alter.table('user_extra_data').foreignKeyAdd('plan_subscription_id','plan_subscriptions','id',{
    nullable:true,
    onDelete:'SET NULL',
    'constraintName':'fk_user_extra_data_plan_subscription'
  });
};

const down = async () => {

  await Alter.table('user_extra_data').dropColumn('plan_subscription_id');
  await Alter.table('user_extra_data').dropConstraintIfExists('fk_user_extra_data_plan_subscription');
  await Schema.table('plan_subscriptions').dropIfExists();


};

export { up, down };
