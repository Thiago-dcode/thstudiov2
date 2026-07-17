import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Column, Schema } from '../lib/facades';

const LAYOUTS = TABLES_ENUM.LAYOUTS;
const LAYOUT_CONFIG = TABLES_ENUM.LAYOUT_CONFIG;
const PORTFOLIOS = TABLES_ENUM.PORTFOLIOS;

const up = async () => {
  await Schema.createEnumIfNotExists('LAYOUT_TYPE');

  await Schema.table(LAYOUTS).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.enum('name', 'LAYOUT_TYPE'),
    Column.boolean('is_active', { default: true }),
    Column.uniques('UC_layouts_name', ['name']),
  ]);

  await Schema.table(LAYOUT_CONFIG).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.foreignKey('layout_id', LAYOUTS, 'id'),
    Column.foreignKey('portfolio_id', PORTFOLIOS, 'id', {
      onDelete: 'CASCADE',
    }),
    Column.jsonb('config', { nullable: true }),
    Column.uniques('UC_layout_config_portfolio', ['portfolio_id']),
  ]);

  // FK columns aren't auto-indexed by Postgres (only the referenced side is);
  // portfolio_id already has one via its unique constraint above.
  await Schema.table(LAYOUT_CONFIG).createIndexIfNotExists(['layout_id']);
};

const down = async () => {
  await Schema.table(LAYOUT_CONFIG).dropIfExists();
  await Schema.table(LAYOUTS).dropIfExists();
  await Schema.dropEnumIfExists('LAYOUT_TYPE');
};

export { up, down };
