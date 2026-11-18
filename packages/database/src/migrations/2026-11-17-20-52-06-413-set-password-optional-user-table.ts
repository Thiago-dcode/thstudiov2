import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Schema } from '../lib/facades';

const USERS = TABLES_ENUM.USERS;

// Accounts created through an OAuth provider have no password.
const up = async () => {
  await Schema.raw(`ALTER TABLE ${USERS} ALTER COLUMN password DROP NOT NULL;`);
};

// No backfill: inventing a password for OAuth-only accounts is not safe, so once any exist
// Postgres rejects this rollback until they are dealt with.
const down = async () => {
  // await Schema.raw(`ALTER TABLE ${USERS} ALTER COLUMN password SET NOT NULL;`);
};

export { up, down };
