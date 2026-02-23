import { ColumnBuilder } from '../lib/builder/columnBuilder';
import SchemaBuilder from '../lib/builder/schemaBuilder';
const TABLE_NAME = 'users';

const up = async () => {
  // Create the users table with all fields from Prisma schema
  await SchemaBuilder.table(TABLE_NAME).withTimestamps(true).createIfNotExists([
    ColumnBuilder.id(),
    ColumnBuilder.uuid('public_id'),
    ColumnBuilder.string('name', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('surname', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('username', 255, {
      unique: true,
    }),
    ColumnBuilder.string('stripe_customer_id', 255, {
      nullable: true,
      unique: true,
    }),
    ColumnBuilder.password(),
    ColumnBuilder.text('biography', {
      nullable: true,
    }),
    ColumnBuilder.string('profession', 100, {
      nullable: true,
    }),
    ColumnBuilder.text('short_biography', {
      nullable: true,
    }),
    ColumnBuilder.string('avatar', 255, {
      nullable: true
    }),
    ColumnBuilder.string('banner', 255, {
      nullable: true
    }),
    ColumnBuilder.email(),
    ColumnBuilder.boolean('email_validated', {
      default: false,
    }),
    ColumnBuilder.boolean('is_active', {
      default: true,
    }),
    ColumnBuilder.boolean('banned', {
      default: false,
    }),
    ColumnBuilder.string('banned_reason', 255, {
      nullable: true
    }),
    ColumnBuilder.integer('funnel_step', {
      default: 1,
    }),
    ColumnBuilder.integer('number_email_validations_sent', {
      default: 0,
    }),
    ColumnBuilder.boolean('twofa_enabled', {
      default: true,
    }),
    ColumnBuilder.string('twofa_code', 10, {
      nullable: true,
    }),
    ColumnBuilder.timestamp('twofa_expires_at', {
      nullable: true,
    }),
    ColumnBuilder.smallInteger('twofa_attempts', {
      default: 0,
    }),

    ColumnBuilder.smallInteger('username_reset_count', {
      default: 0
    }),
    ColumnBuilder.smallInteger('password_reset_count', {
      default: 0
    }),
    ColumnBuilder.timestamp('next_username_reset', {
      nullable: true,
    }),
    ColumnBuilder.timestamp('next_password_reset', {
      nullable: true,
    }),


  ]);
};

const down = async () => {
  // Drop the table

  await SchemaBuilder.table(TABLE_NAME).dropIfExists();
};

export { up, down };
