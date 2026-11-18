import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Column, Schema } from '../lib/facades';

const USER_OAUTH_PROVIDERS = TABLES_ENUM.USER_OAUTH_PROVIDERS;

/**
 * One row per (user, provider) linked account. `provider_user_id` is the provider's stable account
 * id (Google `sub` / `profile.id`) and is what identifies the account. `email` is informational
 * only and is NOT unique: the provider account's email can differ from the user's and can change.
 *
 * `refresh_token` is AES-encrypted at rest with `OAUTH_TOKEN_SECRET` and is NULL until the
 * provider returns one (Google sends it only on first consent).
 *
 * Constraint names are lowercase on purpose: `Column.uniques` emits them unquoted, Postgres folds
 * them to lowercase, and the service matches `DbUniqueViolationException.constraintName` exactly.
 * Their indexes cover every read (`user_id` leads the first one), so no extra index.
 */
const up = async () => {
  await Schema.createEnumIfNotExists('OAUTH_PROVIDERS');

  await Schema.table(USER_OAUTH_PROVIDERS).withTimestamps().createIfNotExists([
    Column.id(),
    Column.foreignKey('user_id', TABLES_ENUM.USERS, 'id', {
      nullable: false,
      onDelete: 'CASCADE',
    }),
    Column.enum('provider', 'OAUTH_PROVIDERS', { nullable: false }),
    Column.string('provider_user_id', 255, { nullable: false }),
    Column.email('email', { unique: false }),
    Column.jsonb('scopes', { nullable: false, default: '[]' }),
    Column.text('refresh_token', { nullable: true }),
    Column.uniques('uc_user_oauth_providers_user_provider', ['user_id', 'provider']),
    Column.uniques('uc_user_oauth_providers_provider_account', ['provider', 'provider_user_id']),
  ]);
};

const down = async () => {
  await Schema.table(USER_OAUTH_PROVIDERS).dropIfExists();
  await Schema.dropEnumIfExists('OAUTH_PROVIDERS');
};

export { up, down };
