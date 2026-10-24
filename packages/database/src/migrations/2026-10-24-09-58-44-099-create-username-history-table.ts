import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Column, Schema } from '../lib/facades';

const USERNAME_HISTORY = TABLES_ENUM.USERNAME_HISTORY;

/**
 * Usernames a user has moved away from. While `reserved_until` is in the future the name belongs to
 * them alone: nobody else can claim it, they can take it back, and `/artists/{old}` 308s to their
 * current username. After that the row is inert and the name is free again.
 *
 * `username` is unique: a name is only ever reserved for one user at a time, so the next owner who
 * moves away from it simply takes the row over.
 */
const up = async () => {
  await Schema.table(USERNAME_HISTORY).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.foreignKey('user_id', TABLES_ENUM.USERS, 'id', {
      nullable: false,
      onDelete: 'CASCADE',
    }),
    Column.string('username', 255, { nullable: false, unique: true }),
    Column.timestamp('reserved_until', { nullable: false }),
  ]);

  await Schema.table(USERNAME_HISTORY).createIndexIfNotExists(['user_id']);
};

const down = async () => {
  await Schema.table(USERNAME_HISTORY).dropIfExists();
};

export { up, down };
