import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Column, Schema } from '../lib/facades';

const ASSETS = TABLES_ENUM.ASSETS;

const up = async () => {
  await Schema.table(ASSETS).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('url', 255, { unique: true }),
    Column.string('slug', 255, { unique: true }),
    Column.string('title', 255, { nullable: true }),
    Column.string('description', 255, { nullable: true }),
    Column.string('filename'),
  ]);
};

const down = async () => {
  await Schema.table(ASSETS).dropIfExists();
};

export { up, down };
