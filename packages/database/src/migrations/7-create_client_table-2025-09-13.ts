import { Schema, Column } from '../lib/facades';

const up = async () => {
  //Your migration code here
  await Schema.table('clients').withTimestamps(true).createIfNotExists([
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
    Column.string('logo', 255, {
      nullable: true,
    }),
    Column.string('website', 255, {
      nullable: true,
    }),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.timestamp('blocked_at', {
      nullable: true,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table('clients').dropIfExists();
};

export { up, down };
