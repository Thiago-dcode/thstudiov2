import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter, Column, Schema } from '../lib/facades';

const BENEFITS = TABLES_ENUM.BENEFITS;
const USER_BENEFITS = TABLES_ENUM.USER_BENEFITS;
const INVITATION_LINKS = TABLES_ENUM.INVITATION_LINKS;
const USERS = TABLES_ENUM.USERS;

const up = async () => {

  await Schema.table(BENEFITS).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.enum('type', 'BENEFIT_TYPE'),
    Column.string('name', 255),
    Column.integer('trial_days'),
    Column.string('stripe_coupon_id', 255, {
      nullable: true,
    }),
    Column.boolean('active', {
      default: true,
    }),
  ]);

  await Schema.table(USER_BENEFITS).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.foreignKey('user_id', USERS, 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.foreignKey('benefit_id', BENEFITS, 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.boolean('redeemed', {
      default: false,
    }),
    Column.uniques('UC_user_benefits', ['user_id', 'benefit_id']),
  ]);

  await Schema.table(INVITATION_LINKS).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.uuid('code'),
    Column.foreignKey('benefit_id', BENEFITS, 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.integer('max_uses', {
      default: 1,
    }),
    Column.integer('current_uses', {
      default: 0,
    }),
    Column.timestamp('expires_at', {
      nullable: true,
    }),
    Column.boolean('active', {
      default: true,
    }),
  ]);

  await Alter.table(USERS).foreignKeyAdd('benefit_id', BENEFITS, 'id', {
    onDelete: 'SET NULL',
    nullable: true,
  });

  await Alter.table(USERS).foreignKeyAdd('invitation_link_id', INVITATION_LINKS, 'id', {
    onDelete: 'SET NULL',
    nullable: true,
  });
};

const down = async () => {
  await Alter.table(USERS).dropColumnIfExists('invitation_link_id');
  await Alter.table(USERS).dropColumnIfExists('benefit_id');

  await Schema.table(INVITATION_LINKS).dropIfExists();
  await Schema.table(USER_BENEFITS).dropIfExists();
  await Schema.table(BENEFITS).dropIfExists();
};

export { up, down };
