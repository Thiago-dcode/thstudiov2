import { createUpdatedAtTrigger } from '../lib/migration/utils';
import { Column, Schema } from '../lib/facades';

const TABLE_NAME = 'user_extra_data';

const up = async () => {

  await Schema.table(TABLE_NAME).createIfNotExists([
    Column.id(),
    Column.bigint('media_size', {
      default: 0,
    }),
    Column.integer('media_count', {
      default: 0,
    }),
    Column.integer('projects_count', {
      default: 0,
    }),
    Column.integer('clients_count', {
      default: 0,
    }),
    Column.integer('services_count', {
      default: 0,
    }),
    Column.timestamp('plan_start_date', {
      default: 'NOW()',
    }),
    Column.enum('billing_type', 'BILLING_TYPES'),
    Column.boolean('plan_autorenewal', {
      default: false,
    }),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
      nullable: true,
    }),
    Column.timestamps(true),
  ]);
  await createUpdatedAtTrigger('user_extra_data');
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table(TABLE_NAME).dropIfExists();
  await Schema.dropEnum('BILLING_TYPES');
};

export { up, down };
