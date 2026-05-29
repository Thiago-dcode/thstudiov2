import { Schema, Column } from '../lib/facades';

const up = async () => {
  await Schema.table('portfolios').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('title', 255),
    Column.string('slug', 255),
    Column.string('thumbnail', 255),
    Column.text('description'),
    Column.boolean('is_active', {
      default: true
    }),
    Column.boolean('is_featured', {
      default: false
    }),
    Column.boolean('is_highlight', {
      default: false
    }),
    Column.timestamp('blocked_at', {
      nullable: true,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
  ]);
  await Schema.table('portfolio_media').createIfNotExists([
    Column.id(),
    Column.foreignKey('portfolio_id', 'portfolios', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('media_id', 'media', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.smallInteger('position'),
    Column.uniques('UC_portfolio_media', ['portfolio_id', 'media_id'])
  ]);

  await Schema.table('portfolio_collection').createIfNotExists([
    Column.id(),
    Column.foreignKey('portfolio_id', 'portfolios', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('collection_id', 'collections', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.smallInteger('position'),
    Column.uniques('UC_portfolio_collection', ['portfolio_id', 'collection_id'])
  ]);
  await Schema.table('portfolio_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.text('description'),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.foreignKey('portfolio_id', 'portfolios', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.uniques('UC_portfolio_translation', ['language_code', 'portfolio_id'])
  ]);
};

const down = async () => {
  await Schema.table('portfolio_translations').dropIfExists();
  await Schema.table('portfolio_collection').dropIfExists();
  await Schema.table('portfolio_media').dropIfExists();
  await Schema.table('portfolios').dropIfExists();
};

export { up, down };
