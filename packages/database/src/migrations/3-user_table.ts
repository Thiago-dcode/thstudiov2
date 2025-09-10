import { createUpdatedAtTrigger } from '../lib/migration/utils';
import { ColumnBuilder } from '../lib/builder/columnBuilder';
import SchemaBuilder from '../lib/builder/schemaBuilder';
const TABLE_NAME = 'users';

const up = async () => {
  // Create the users table with all fields from Prisma schema
  await SchemaBuilder.table(TABLE_NAME).createIfNotExists([
    ColumnBuilder.id(),
    ColumnBuilder.string('name', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('username', 255, {
      nullable: true,
      unique: true,
    }),
    ColumnBuilder.email(),
    ColumnBuilder.password(),
    ColumnBuilder.text('biography', {
      nullable: true,
    }),
    ColumnBuilder.foreignKey('extra_data_id', 'user_extra_data', 'id', {
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      nullable: false,
    }),
    ColumnBuilder.timestamps(true),
  ]);
  await createUpdatedAtTrigger('users');
};

const down = async () => {
  // Drop the table
 
 
  await SchemaBuilder.table(TABLE_NAME).dropTrigger('update_users_updated_at');
  await SchemaBuilder.table(TABLE_NAME).drop();
 
};

export { up, down };
