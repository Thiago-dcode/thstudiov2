import { Column, Schema } from '../lib/facades';
import { createTimeStampsTrigger } from '../lib/scripts/utils';


const up = async () => {
  //Your migration code here

    Schema.table('transactions').createIfNotExists([
    Column.id(),
    Column.string('transaction_id'),
    Column.enum('status', 'TRANSACTION_STATUS'),
    Column.enum('payment_status', 'PAYMENT_STATUS'),
    Column.enum('payment_method', 'PAYMENT_METHOD'),
    Column.enum('product_type', 'PRODUCT_TYPE'),
    //IN EUROS
    Column.float('amount'),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('plan_price_id', 'plan_prices', 'id', {
      onDelete: 'SET NULL',
      nullable:true,
    }),
    Column.timestamps(true),
  ]);
  await createTimeStampsTrigger('transactions');

};

const down = async () => {

  await Schema.table('transactions').dropIfExists();
};

export { up, down };
