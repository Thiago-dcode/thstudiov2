import { Column, Schema } from '../lib/facades';

const TABLE_NAME = 'email_preferences';

const up = async () => {
  await Schema.table(TABLE_NAME).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.email('email'),
    Column.uuid('token'),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'SET NULL',
      nullable: true,
      unique:true,
    }),
    Column.boolean('transactional', { default: true }),
    Column.boolean('marketing', { default: true }),
    Column.boolean('notifications', { default: true }),
    Column.boolean('waitlist_updates', { default: true }),
  ]);
};

const down = async () => {
  await Schema.table(TABLE_NAME).dropIfExists();
};

export { up, down };
