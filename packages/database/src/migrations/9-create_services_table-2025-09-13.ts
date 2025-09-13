import { Column, Schema } from 'lib/facades';
import { createUpdatedAtTrigger } from 'lib/migration/utils';

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
  await createUpdatedAtTrigger('services');
  Schema.table('service_media').createIfNotExists([
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
    Column.foreignKey('language_code', 'languages', 'code', {
      onDelete: 'CASCADE',
      type: 'LANGUAGE_CODE',
    }),
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
