import { Column, Schema } from '../lib/facades';

const up = async () => {
  await Schema.table('user_storage_requests').withTimestamps().createIfNotExists([
    Column.id(),
    Column.string('path',255),
    Column.integer('bytes'),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
  ]);
};

const down = async () => {
  await Schema.table('user_storage_requests').dropIfExists();
};

export { up, down };
