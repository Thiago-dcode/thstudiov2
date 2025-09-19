import { Alter } from '../lib/facades';

const up = async () => {
  await Alter.table('user_extra_data').dropColumnIfExists(
    'last_transaction_id',
  );
  await Alter.table('user_extra_data').foreignKeyAdd(
    'last_transaction_id',
    'user_plan_transactions',
    'id',
    {
      type: 'BIGINT',
      onDelete: 'SET NULL',
      nullable: true,
      constraintName: 'fk_user_extra_data_last_transaction_id',
    },
  );
};

const down = async () => {
  await Alter.table('user_extra_data').dropConstraintIfExists(
    'fk_user_extra_data_last_transaction_id',
  );
  await Alter.table('user_extra_data').dropColumnIfExists('last_transaction_id');
 
};

export { up, down };
