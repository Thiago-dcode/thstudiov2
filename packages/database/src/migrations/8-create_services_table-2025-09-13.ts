import { Column, Schema } from '../lib/facades';

const up = async () => {
  //Your migration code here

  await Schema.table('services').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('title'),
    Column.string('slug', 255),
    Column.text('description'),
    Column.string('thumbnail', 255, {
      nullable: true,
    }),
    Column.float('price', {
      nullable: true,
    }),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.boolean('is_featured', {
      default: false
    }),
    Column.boolean('is_highlight', {
      default: false
    }),
    Column.boolean('show_price', {
      default: false,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('portfolio_id', 'portfolios', 'id', {
      onDelete: 'SET NULL',
      nullable: true,
    }),
  ]);
  // await Schema.table('service_media').createIfNotExists([
  //   Column.id(),
  //   Column.foreignKey('service_id', 'services', 'id', {
  //     onDelete: 'CASCADE',
  //   }),
  //   Column.foreignKey('media_id', 'media', 'id', {
  //     onDelete: 'CASCADE',
  //   }),
  //   Column.smallInteger('position'),
  //   Column.uniques('UC_service_media', ['service_id', 'media_id'])
  // ]);

  await Schema.table('service_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.text('description'),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.foreignKey('service_id', 'services', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.uniques('UC_service_translation', ['language_code', 'service_id'])
  ]);

  await Schema.table('service_features').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('title'),
    Column.foreignKey('service_id', 'services', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);

  await Schema.table('service_terms').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('title'),
    Column.foreignKey('service_id', 'services', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table('service_terms').dropIfExists();
  await Schema.table('service_features').dropIfExists();
  await Schema.table('service_translations').dropIfExists();
  // await Schema.table('service_media').dropIfExists();
  await Schema.table('services').dropIfExists();
};

export { up, down };
