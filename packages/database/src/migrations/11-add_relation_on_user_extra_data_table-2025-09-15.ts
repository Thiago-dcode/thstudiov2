import { Alter } from '../lib/facades';
const TABLE_NAME = 'user_extra_data';
const COLUMN_NAME = 'last_plan_transaction_id';
const CONSTRAINT_NAME = 'fk_user_extra_data_last_plan_transaction_id';

const up = async () => {
  await Alter.table(TABLE_NAME).dropColumnIfExists(
    COLUMN_NAME,
  );
  await Alter.table(TABLE_NAME).foreignKeyAdd(
    COLUMN_NAME,
    'user_plan_transactions',
    'id',
    {
      type: 'BIGINT',
      onDelete: 'SET NULL',
      nullable: true,
      constraintName: CONSTRAINT_NAME,
    },
  );
};

const down = async () => {
  await Alter.table(TABLE_NAME).dropConstraintIfExists(
    CONSTRAINT_NAME,
  );
  await Alter.table(TABLE_NAME).dropColumnIfExists(COLUMN_NAME);
 
};

export { up, down };
