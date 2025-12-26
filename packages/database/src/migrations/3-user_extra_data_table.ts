import { createTimeStampsTrigger } from '../lib/scripts/utils';
import { Column, Schema } from '../lib/facades';

const TABLE_NAME = 'user_extra_data';

const up = async () => {
  await Schema.table(TABLE_NAME).createIfNotExists([
    Column.id(),
    //MB
    Column.integer('media_size', {
      default: 0,
    }),
    Column.smallInteger('media_count', {
      default: 0,
    }),
    Column.smallInteger('projects_count', {
      default: 0,
    }),
    Column.smallInteger('clients_count', {
      default: 0,
    }),
    Column.smallInteger('services_count', {
      default: 0,
    }),
    Column.smallInteger('portfolios_count', {
      default: 0,
    }),
    Column.smallInteger('storage_requests_count', {
      default: 0,
    }),
    Column.timestamp('last_storage_request_date', {
      default: 'NOW()',
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
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
