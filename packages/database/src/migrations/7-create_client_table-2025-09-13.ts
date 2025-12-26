import { Schema, Column } from '../lib/facades';

import { createTimeStampsTrigger } from '../lib/scripts/utils';

const up = async () => {
  //Your migration code here
  await Schema.table('clients').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.text('description', {
      nullable: true,
    }),
    Column.string('email', 255, {
      nullable: true,
    }),
    Column.string('phone', 20, {
      nullable: true,
    }),
    Column.string('address', 255, {
      nullable: true,
    }),
    Column.string('logo', 255, {
      nullable: true,
    }),
    Column.string('website', 255, {
      nullable: true,
    }),
    Column.foreignKey('address_id', 'addresses', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.timestamps(true),
  ]);
  await createTimeStampsTrigger('clients');
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table('clients').dropIfExists();
};

export { up, down };
