import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { ColumnBuilder } from '../lib/builder/columnBuilder';
import SchemaBuilder from '../lib/builder/schemaBuilder';

const USERS = TABLES_ENUM.USERS;
const ROLES = TABLES_ENUM.ROLES;

const up = async () => {
  await SchemaBuilder.table(ROLES).withTimestamps(true).createIfNotExists([
    ColumnBuilder.id(),
    ColumnBuilder.enum('name', 'USER_ROLE', { unique: true }),
  ]);

  await SchemaBuilder.table(USERS).withTimestamps(true).createIfNotExists([
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
    ColumnBuilder.string('phone_number', 20, {
      nullable: true,
    }),
    ColumnBuilder.string('facebook_link', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('website_link', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('instagram_link', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('youtube_link', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('avatar', 255, {
      nullable: true,
    }),
    ColumnBuilder.string('banner', 255, {
      nullable: true,
    }),
    ColumnBuilder.boolean('is_featured', {
      default: false,
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
      nullable: true,
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
    ColumnBuilder.string('twofa_code', 60, {
      nullable: true,
    }),
    ColumnBuilder.timestamp('twofa_expires_at', {
      nullable: true,
    }),
    ColumnBuilder.smallInteger('twofa_attempts', {
      default: 0,
    }),

    ColumnBuilder.smallInteger('username_reset_count', {
      default: 0,
    }),
    ColumnBuilder.smallInteger('password_reset_count', {
      default: 0,
    }),
    ColumnBuilder.timestamp('next_username_reset', {
      nullable: true,
    }),
    ColumnBuilder.timestamp('next_password_reset', {
      nullable: true,
    }),
    ColumnBuilder.foreignKey('role_id', 'roles', 'id', {
      nullable: false
    }),
    ColumnBuilder.enum('language', 'LANGUAGE_CODE', {
      default: DEFAULT_LANGUAGE,
    }),
    ColumnBuilder.string('seo_title', 70, {
      nullable: true,
    }),
    ColumnBuilder.string('seo_description', 160, {
      nullable: true,
    }),
    ColumnBuilder.timestamp('seo_generated_at', {
      nullable: true,
    }),
  ]);

  // Per-locale SEO for artist profiles (EN/ES/PT). Main users.seo_* columns hold the EN fallback.
  await SchemaBuilder.table('user_translations').createIfNotExists([
    ColumnBuilder.id(),
    ColumnBuilder.string('seo_title', 70, {
      nullable: true,
    }),
    ColumnBuilder.string('seo_description', 160, {
      nullable: true,
    }),
    ColumnBuilder.enum('language_code', 'LANGUAGE_CODE'),
    ColumnBuilder.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    ColumnBuilder.uniques('UC_user_translation', ['language_code', 'user_id']),
  ]);
};

const down = async () => {
  await SchemaBuilder.table('user_translations').dropIfExists();
  await SchemaBuilder.table(USERS).dropIfExists();
  await SchemaBuilder.table(ROLES).dropIfExists();
};

export { up, down };
