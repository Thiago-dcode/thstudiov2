import { createTimeStampsTrigger } from '../lib/scripts/utils';
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
    Column.integer('storage_requests_count', {
      default: 0,
    }),
    Column.timestamp('last_storage_request_date', {
      default: 'NOW()',
    }),
    Column.timestamp('plan_start_date', {
      default: 'NOW()',
    }),
    Column.timestamp('plan_end_date', {
      nullable: true,
    }),
    Column.boolean('plan_autorenewal', {
      default: true,
    }),
    //If plan is free, will auto renew, and is not necessary a last transaction
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
      nullable: true,
    }),
    Column.timestamps(true),
  ]);
  await createTimeStampsTrigger('user_extra_data');
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table(TABLE_NAME).dropIfExists();
};

export { up, down };
