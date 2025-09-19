import { createTimeStampsTrigger } from '../lib/scripts/utils';
import { Schema, Column } from '../lib/facades';

const up = async () => {
  await Schema.table('portfolios').createIfNotExists([
    Column.id(),
    Column.string('title', 255, {}),
    Column.text('description'),
    Column.timestamps(true),
  ]);
  await Schema.table('portfolio_media').createIfNotExists([
    Column.id(),
    Column.foreignKey('portfolio_id', 'portfolios', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('media_id', 'media', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.integer('sort_order'),
  ]);

  await Schema.table('portfolio_collection').createIfNotExists([
    Column.id(),
    Column.foreignKey('portfolio_id', 'portfolios', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('collection_id', 'collections', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.integer('sort_order'),
  ]);
  await Schema.table('portfolio_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.text('description'),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.foreignKey('portfolio_id', 'portfolios', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);
  await createTimeStampsTrigger('portfolios');
};

const down = async () => {
  await Schema.table('portfolio_translations').dropIfExists();
  await Schema.table('portfolio_collection').dropIfExists();
  await Schema.table('portfolio_media').dropIfExists();
  await Schema.table('portfolios').dropIfExists();
};

export { up, down };
