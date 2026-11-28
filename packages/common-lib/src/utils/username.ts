import { RESERVED_USERNAMES } from '../constants/reserved-usernames';

/** Persist and look up usernames as lowercase so they are case-insensitive. */
export const normalizeUsername = (username: string): string =>
  username.trim().toLowerCase();

/**
 * Whether nobody may hold `name` (routes, brands, future pages: see `RESERVED_USERNAMES`).
 * Case-insensitive and trimmed. `Object.hasOwn`, not `in`, so `toString`/`valueOf` never match.
 */
export const isReservedUsername = (name: string): boolean =>
  Object.hasOwn(RESERVED_USERNAMES, normalizeUsername(name));

/**
 * The shape of any stored username, legacy ones included (wider than the registration rule,
 * which is `[a-z0-9]{3,20}`). Used to decide whether a root URL segment can be an artist at all.
 */
export const USERNAME_ROUTE_PATTERN = /^[a-z0-9_-]{3,50}$/i;

/**
 * Whether a root URL segment (`a11studio.com/{segment}`) can be an artist page: username-shaped
 * and not reserved. Case-insensitive. Cheap and pure, so it runs before any API call.
 */
export const isArtistRouteSegment = (segment: string): boolean =>
  USERNAME_ROUTE_PATTERN.test(segment) && !isReservedUsername(segment);
