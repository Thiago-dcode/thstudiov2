import { ColumnBuilder } from 'lib/builder/columnBuilder';
import SchemaBuilder from '../lib/builder/schemaBuilder';
import { QueryBuilder } from '../lib/builder/queryBuilder';
const TABLE_NAME = 'users';

const up = async () => {
  // Create the users table with all fields from Prisma schema
  await SchemaBuilder.table(TABLE_NAME).create([
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
    ColumnBuilder.foreignKey('role_id', 'roles', 'id', {
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    }),
    ColumnBuilder.timestamps(),
    ColumnBuilder.softDelete(),
  ]);
};

const down = async () => {
  // Drop the table
  await SchemaBuilder.table(TABLE_NAME).drop();
};

export { up, down };
