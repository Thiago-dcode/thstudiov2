/**
 * Public artist URLs live at the root: `a11studio.com/{username}/…` (`/es/…`, `/pt/…` per locale).
 * Every builder here is locale-agnostic, starts with `/` and `encodeURIComponent`s each segment.
 */
import { USERNAME_ROUTE_PATTERN } from './username';

const seg = (value: string): string => encodeURIComponent(value);

export type ArtistListKind = 'portfolios' | 'collections' | 'services';

/** `/{u}`: the artist's profile. */
export const artistPath = (username: string): string => `/${seg(username)}`;

/** `/{u}/about` */
export const artistAboutPath = (username: string): string => `${artistPath(username)}/about`;

/** `/{u}/{kind}`: the artist's portfolios, collections or services list. */
export const artistListPath = (username: string, kind: ArtistListKind): string =>
  `${artistPath(username)}/${kind}`;

/** `/{u}/portfolios/{slug}` */
export const artistPortfolioPath = (username: string, slug: string): string =>
  `${artistListPath(username, 'portfolios')}/${seg(slug)}`;

/** `/{u}/collections/{slug}` */
export const artistCollectionPath = (username: string, slug: string): string =>
  `${artistListPath(username, 'collections')}/${seg(slug)}`;

/** `/{u}/services/{slug}` */
export const artistServicePath = (username: string, slug: string): string =>
  `${artistListPath(username, 'services')}/${seg(slug)}`;

/** `/{u}/media/{public_id}`: the PRIMARY media URL the nested views canonicalize to. */
export const artistMediaPath = (username: string, publicId: string): string =>
  `${artistPath(username)}/media/${seg(publicId)}`;

/** `/{u}/portfolios/{slug}/media/{public_id}` (canonicalizes to {@link artistMediaPath}). */
export const artistPortfolioMediaPath = (username: string, slug: string, publicId: string): string =>
  `${artistPortfolioPath(username, slug)}/media/${seg(publicId)}`;

/** `/{u}/collections/{slug}/media/{public_id}` (canonicalizes to {@link artistMediaPath}). */
export const artistCollectionMediaPath = (username: string, slug: string, publicId: string): string =>
  `${artistCollectionPath(username, slug)}/media/${seg(publicId)}`;

/**
 * SQL expression for {@link artistPath} in repository queries: `('/' || u.username)`. Append the
 * rest with `||` (`${artistPathSql('u.username')} || '/portfolios/' || p.slug`). `usernameColumn`
 * must be a trusted column reference, never user input. Usernames and slugs are URL-safe by their
 * validation rules, so the SQL form needs no encoding.
 */
export const artistPathSql = (usernameColumn: string): string => `('/' || ${usernameColumn})`;

/**
 * `/{u}/rest…` → `{ username, rest }` (`rest` starts with `/` or is `''`); `null` otherwise. The
 * username segment must match `USERNAME_ROUTE_PATTERN` (shape only: reserved names are the
 * caller's call), and `artists` (the directory hub) is never a username. Query strings and
 * fragments are dropped; `username` is returned as written (not lowercased) and `rest` untouched.
 */
export const parseArtistPath = (path: string): { username: string; rest: string } | null => {
  if (typeof path !== 'string') return null;
  const pathname = path.split(/[?#]/, 1)[0] ?? '';
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match) return null;
  const [, username, rest = ''] = match;
  if (!USERNAME_ROUTE_PATTERN.test(username) || username.toLowerCase() === 'artists') return null;
  return { username, rest };
};
