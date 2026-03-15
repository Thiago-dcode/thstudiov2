import { Schema, Column } from '../lib/facades';
import SchemaBuilder from '../lib/builder/schemaBuilder';
const up = async () => {
  await Schema.table('plans').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('stripe_id', 255, {
      unique: true,
    }),
    Column.string('paypal_id', 255, {
      unique: true,
      nullable:true,
    }),
    Column.string('name', 255, {
      unique: true,
    }),
    Column.string('short_description', 255),
    Column.text('description'),
    Column.string('logo', 255, {
      unique: true,
    }),
    Column.float('base_price'),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.boolean('is_popular', {
      default: true,
    }),
    Column.boolean('is_free', {
      default: false,
    }),
    Column.integer('max_media_size'),
    Column.smallInteger('max_projects'),
    Column.smallInteger('max_portfolios'),
    Column.smallInteger('max_clients'),
    Column.smallInteger('max_services'),
    Column.boolean('allow_media_compression',{
      default:false
    }),
    //Monthly
    Column.smallInteger('ai_credits'),
    Column.smallInteger('limit_write_storage_per_day'),
  ]);
 

  await Schema.table('plan_prices').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('stripe_id', 255, {
      unique: true,
      nullable:true
    }),
    Column.string('paypal_id', 255, {
      unique: true,
      nullable:true,
    }),
    Column.float('price'),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.enum('billing_type', 'BILLING_TYPE'),
  ]);

  await Schema.table('plan_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.string('short_description', 255),
    Column.text('description'),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.uniques('UC_plan_translation',['language_code','plan_id'])
  ]);
  await Schema.table('plan_offers').withTimestamps(true).createIfNotExists([
    Column.id(),

    Column.string('name'),
    Column.text('description'),
    //Discount in percentage
    Column.integer('discount'),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.enum('type', 'PLAN_OFFERS_TYPE'),
    Column.timestamp('start_date'),
    Column.timestamp('end_date'),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('plan_price_id', 'plan_prices', 'id', {
      onDelete: 'CASCADE',
      nullable: true,
    }),
  ]);
};

const down = async () => {
  // Drop the table
  await Schema.table('plan_offers').dropIfExists();
  await Schema.table('plan_prices').dropIfExists();
  await Schema.table('plan_translations').dropIfExists();
  await SchemaBuilder.table('plans').dropIfExists();
};

export { up, down };
