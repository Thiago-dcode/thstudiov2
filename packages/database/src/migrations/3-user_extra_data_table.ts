import { Column, Schema } from '../lib/facades';

const TABLE_NAME = 'user_extra_data';

const up = async () => {
  await Schema.table(TABLE_NAME).withTimestamps(true).createIfNotExists([
    Column.id(),
    //MB
    Column.float('media_size', {
      default: 0,
    }),
    Column.smallInteger('media_count', {
      default: 0,
    }),
    Column.smallInteger('projects_count', {
      default: 0,
    }),
    Column.smallInteger('clients_count', {
      default: 0,
    }),
    Column.smallInteger('services_count', {
      default: 0,
    }),
    Column.smallInteger('portfolios_count', {
      default: 0,
    }),
    Column.smallInteger('ai_credits', {
      default: 0,
    }),
    Column.smallInteger('ai_credits_consumed', {
      default: 0,
    }),
    Column.timestamp('next_ai_credits_reset', {
      default: "NOW()"
    }),
    Column.timestamp('last_ai_credits_reset', {
      default: 'NOW()'
    }),

    Column.smallInteger('account_strikes', {
      default: 0,
    }),
    Column.timestamp('next_strike_reset', {
      default: "NOW()"
    }),
    Column.timestamp('last_strike_reset', {
      default: 'NOW()'
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table(TABLE_NAME).dropIfExists();
};

export { up, down };
