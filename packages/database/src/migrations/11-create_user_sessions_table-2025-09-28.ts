import { Schema, Column, Alter } from "src/lib/facades";
const up = async () => {

  await Schema.table('user_auth_devices').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('user_agent', 255),
    Column.text('ip_address'),
    Column.boolean('disabled', {
      default: true,
    }),
    Column.boolean('blocked', {
      default: false,
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
  await Alter.table('users').addColumn('twofa_enabled', 'BOOLEAN', {
    default: true,
  });
  await Alter.table('users').addColumn('twofa_code', 'VARCHAR(255)', {
    nullable: true,
  });
  await Alter.table('users').addColumn('twofa_expires_at', 'TIMESTAMP', {
    nullable: true,
  });
  await Alter.table('users').addColumn('twofa_attempts', 'INTEGER', {
    default: 0,
  });


};

const down = async () => {
  await Alter.table('users').dropColumn('twofa_enabled');
  await Alter.table('users').dropColumn('twofa_code');
  await Alter.table('users').dropColumn('twofa_expires_at');
  await Alter.table('users').dropColumn('twofa_attempts');
  //Your migration rollback code here
  await Schema.table('user_sessions').dropIfExists();
  await Schema.table('user_auth_devices').dropIfExists();
};

export { up, down };
