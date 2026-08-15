import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Column, Schema } from '../lib/facades';

const PROFILE_STATUS = TABLES_ENUM.PROFILE_STATUS;
const USERS = TABLES_ENUM.USERS;

const up = async () => {
  await Schema.table(PROFILE_STATUS).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.foreignKey('user_id', USERS, 'id', {
      onDelete: 'CASCADE',
    }),
    Column.boolean('has_full_name_field', { default: false }),
    Column.boolean('has_profession_field', { default: false }),
    Column.boolean('has_avatar_field', { default: false }),
    Column.boolean('has_location', { default: false }),
    Column.boolean('has_categories', { default: false }),
    Column.boolean('has_portfolio', { default: false }),
    Column.boolean('has_about_page', { default: false }),
    Column.uniques('UC_profile_status_user', ['user_id']),
  ]);
};

const down = async () => {
  await Schema.table(PROFILE_STATUS).dropIfExists();
};

export { up, down };
