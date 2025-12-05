import { Column, Schema } from "src/lib/facades";
import { createTimeStampsTrigger } from "src/lib/scripts/utils";

const up = async () => {

  await Schema.table('password_recovery_attempts').createIfNotExists([  
    Column.id(),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.string('fallback_url'),
    Column.string('code',255,{
      unique: true,
    }),
    Column.timestamp('expires_at'),
    Column.timestamps(true),
  ]);
  await createTimeStampsTrigger('password_recovery_attempts');
};

const down = async () => {

  //Your migration rollback code here
  Schema.table('password_recovery_attempts').dropIfExists();

};

export { up, down };
