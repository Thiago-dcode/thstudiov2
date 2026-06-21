import { Column, Schema } from '../lib/facades';

const up = async () => {

  await Schema.table('password_recovery_attempts').withTimestamps(true).createIfNotExists([  
    Column.id(),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.string('fallback_url'),
    Column.string('code',255,{
      unique: true,
    }),
    Column.boolean('code_validated',{
      default:false
    }),
    Column.timestamp('expires_at'),
  ]);
};

const down = async () => {

  //Your migration rollback code here
  Schema.table('password_recovery_attempts').dropIfExists();

};

export { up, down };
