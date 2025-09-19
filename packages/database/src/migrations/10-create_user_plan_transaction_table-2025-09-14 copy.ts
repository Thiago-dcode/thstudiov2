import { Column, Schema } from '../lib/facades';
import { createTimeStampsTrigger } from '../lib/scripts/utils';


const up = async () => {
  //Your migration code here

    Schema.table('user_plan_transactions').createIfNotExists([
    Column.id(),
    Column.string('transaction_id'),
    Column.enum('status', 'TRANSACTION_STATUS'),
    Column.enum('payment_status', 'PAYMENT_STATUS'),
    Column.enum('payment_method', 'PAYMENT_METHOD', {
      nullable: true,
    }),
    Column.float('amount'),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('plan_price_id', 'plan_prices', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('plan_offer_id', 'plan_offers', 'id', {
      onDelete: 'CASCADE',
      nullable: true,
    }),
    Column.timestamps(true),
  ]);
  await createTimeStampsTrigger('user_plan_transactions');
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table('user_plan_transactions').dropIfExists();
};

export { up, down };
