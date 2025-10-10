import { createTimeStampsTrigger } from '../lib/scripts/utils';
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
    ColumnBuilder.string('surname', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('username', 255, {
      unique: true,
    }),
    ColumnBuilder.password(),
    ColumnBuilder.text('biography', {
      nullable: true,
    }),
    ColumnBuilder.email(),
    ColumnBuilder.boolean('email_validated', {
      default: false,
    }),
    ColumnBuilder.boolean('is_active', {
      default: true,
    }),
    ColumnBuilder.integer('number_email_validations_sent', {
      default: 0,
    }),
    ColumnBuilder.foreignKey('address_id', 'addresses', 'id', {
      onDelete: 'SET NULL',
      nullable: true,
    }),

    ColumnBuilder.timestamps(true),
  ]);
  await createTimeStampsTrigger('users');
};

const down = async () => {
  // Drop the table

  await SchemaBuilder.table(TABLE_NAME).dropIfExists();
};

export { up, down };
