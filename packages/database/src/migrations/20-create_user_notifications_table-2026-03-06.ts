import { Column, Schema } from 'src/lib/facades';

const up = async () => {
  await Schema.table('user_notifications').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('notification_type', 100),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.jsonb('payload'),
    Column.timestamp('seen_at', {
      nullable: true,
    }),
    Column.timestamp('read_at', {
      nullable: true,
    }),
  ]);

  // Create indexes for efficient queries
  await Schema.table('user_notifications').createIndexIfNotExists(
    ['user_id', 'created_at DESC']
  );

  await Schema.table('user_notifications').createIndexIfNotExists(
    ['user_id', 'read_at']
  );

  // Consider GIN index on payload only if you frequently query JSON content
  // await Schema.table('user_notifications').createIndexIfNotExists(
  //   'idx_user_notifications_payload_gin',
  //   'payload',
  //   { type: 'gin' }
  // );
};

const down = async () => {
  await Schema.table('user_notifications').dropIfExists();
};

export { up, down };
