import { Column, Schema } from 'lib/facades';
import { createTimeStampsTrigger, createUpdatedAtTrigger } from '../lib/scripts/utils';

const up = async () => {
  //Your migration code here

  await Schema.table('services').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.text('description'),
    Column.float('price'),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.boolean('show_price', {
      default: false,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.timestamps(true),
  ]);
  await createTimeStampsTrigger('services');
  await Schema.table('service_media').createIfNotExists([
    Column.id(),
    Column.foreignKey('service_id', 'services', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('media_id', 'media', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.integer('sort_order'),
  ]);

  await Schema.table('service_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.text('description'),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.foreignKey('service_id', 'services', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table('service_translations').dropIfExists();
  await Schema.table('service_media').dropIfExists();
  await Schema.table('services').dropIfExists();
};

export { up, down };
