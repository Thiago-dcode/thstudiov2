import { UsernameHistorySchema } from '../schemas/username-history';

/** The current username an old one redirects to, or `null` when it has no active reservation. */
export type UsernameRedirect = { username: string } | null;

export type ReserveUsernameInput = Pick<UsernameHistorySchema, 'user_id' | 'username' | 'reserved_until'>;
