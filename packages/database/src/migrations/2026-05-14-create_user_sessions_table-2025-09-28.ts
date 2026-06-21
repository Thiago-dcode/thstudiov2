import { Schema, Column } from '../lib/facades';
const up = async () => {

  await Schema.table('user_auth_devices').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('user_agent', 255),
    Column.text('ip_address'),
    Column.boolean('disabled', {
      default: true,
    }),
    Column.timestamp('blocked_at', {
      nullable: true,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);

  await Schema.table('user_sessions').withTimestamps(true).createIfNotExists([
    Column.id(),
   Column.text('token'),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('user_auth_device_id', 'user_auth_devices', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.timestamp('expires_at'),
  ]);



};

const down = async () => {
  //Your migration rollback code here
  await Schema.table('user_sessions').dropIfExists();
  await Schema.table('user_auth_devices').dropIfExists();
};

export { up, down };
