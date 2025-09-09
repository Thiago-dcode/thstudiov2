import { ColumnBuilder } from '../lib/builder/columnBuilder';
import SchemaBuilder from '../lib/builder/schemaBuilder';

const TABLE_NAME = 'user_extra_data';

const up = async () => {
  await SchemaBuilder.table(TABLE_NAME).createEnumIfNotExists('BILLING_TYPES');
  await SchemaBuilder.table(TABLE_NAME).create([
    ColumnBuilder.id(),
    ColumnBuilder.bigint('media_size', {
      default: 0,
    }),
    ColumnBuilder.integer('media_count', {
      default: 0,
    }),
    ColumnBuilder.integer('projects_count', {
      default: 0,
    }),
    ColumnBuilder.integer('clients_count', {
      default: 0,
    }),
    ColumnBuilder.integer('services_count', {
      default: 0,
    }),
    ColumnBuilder.timestamp('plan_start_date', {
      default: 'NOW()',
    }),
    ColumnBuilder.enum('billing_type', 'BILLING_TYPES'),
    ColumnBuilder.boolean('plan_autorenewal', {
      default: false,
    }),
    ColumnBuilder.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
      nullable: true,
    }),
    ColumnBuilder.timestamps(),
    ColumnBuilder.softDelete(),
  ]);
};

const down = async () => {
  //Your migration rollback code here
  await SchemaBuilder.table(TABLE_NAME).drop();
  await SchemaBuilder.table(TABLE_NAME).dropEnum('BILLING_TYPES');
};

export { up, down };
