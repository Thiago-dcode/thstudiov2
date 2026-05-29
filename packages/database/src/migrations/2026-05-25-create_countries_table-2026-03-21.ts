import { Column, Schema } from '../lib/facades';

const up = async () => {
  await Schema.table('countries').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('country_code', 5, {
      unique: true,
    }),
    Column.string('name', 255),
  ]);

  await Schema.table('states').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('name', 255),
    Column.foreignKey('country_id', 'countries', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);

  await Schema.table('cities').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('name', 255),
    Column.foreignKey('state_id', 'states', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('country_id', 'countries', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);
};

const down = async () => {
  await Schema.table('cities').dropIfExists();
  await Schema.table('states').dropIfExists();
  await Schema.table('countries').dropIfExists();
};

export { up, down };
