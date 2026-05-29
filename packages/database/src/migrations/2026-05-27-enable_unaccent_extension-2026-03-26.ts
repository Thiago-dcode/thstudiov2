import { Schema } from '../lib/facades';

/** Enables unaccent for accent-insensitive text matching (e.g. addresses.state vs states.name). */
const up = async () => {
  await Schema.raw('CREATE EXTENSION IF NOT EXISTS unaccent;');
};

const down = async () => {
  await Schema.raw('DROP EXTENSION IF EXISTS unaccent;');
};

export { up, down };
