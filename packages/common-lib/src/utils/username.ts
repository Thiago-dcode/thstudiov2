/** Persist and look up usernames as lowercase so they are case-insensitive. */
export const normalizeUsername = (username: string): string =>
  username.trim().toLowerCase();
