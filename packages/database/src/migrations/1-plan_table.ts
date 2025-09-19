import { Schema, Column } from '../lib/facades';
import SchemaBuilder from '../lib/builder/schemaBuilder';
import { createTimeStampsTrigger } from '../lib/scripts/utils';
const up = async () => {
  await Schema.table('plans').createIfNotExists([
    Column.id(),
    Column.string('name', 255, {
      unique: true,
    }),
    Column.text('description'),
    Column.string('logo', 255, {
      unique: true,
    }),
    Column.float('base_price'),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.boolean('is_free', {
      default: false,
    }),
    Column.integer('max_media_size'),
    Column.integer('max_projects_count'),
    Column.integer('max_clients_count'),
    Column.integer('max_services_count'),
    Column.boolean('powered_by_ai', {
      default: false,
    }),
    Column.integer('limit_storage_requests_per_day'),
    Column.timestamps(true),
  ]);

  await createTimeStampsTrigger('plans');
  await Schema.table('plan_prices').createIfNotExists([
    Column.id(),
    Column.float('price'),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.enum('billing_type', 'BILLING_TYPES'),
  ]);
  await createTimeStampsTrigger('plan_prices');

  await Schema.table('plan_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.string('description'),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
    Column.enum('language_code', 'LANGUAGE_CODE'),
  ]);
  await Schema.table('plan_offers').createIfNotExists([
    Column.id(),

    Column.string('name'),
    Column.text('description'),
    //Discount in percentage
    Column.integer('discount'),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.enum('type', 'PLAN_OFFERS_TYPES'),
    Column.timestamp('start_date'),
    Column.timestamp('end_date'),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('plan_price_id', 'plan_prices', 'id', {
      onDelete: 'CASCADE',
      nullable: true,
    }),
    Column.timestamps(true),
  ]);
  await createTimeStampsTrigger('plan_offers');
};

const down = async () => {
  // Drop the table
  await Schema.table('plan_offers').dropIfExists();
  await Schema.table('plan_prices').dropIfExists();
  await Schema.table('plan_translations').dropIfExists();
  await SchemaBuilder.table('plans').dropIfExists();
};

export { up, down };
