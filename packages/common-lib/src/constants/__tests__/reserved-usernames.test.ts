import * as fs from 'fs';
import * as path from 'path';
import { RESERVED_USERNAME_GROUPS, RESERVED_USERNAMES } from '../reserved-usernames';
import { isArtistRouteSegment, isReservedUsername } from '../../utils/username';
import { PLAN_RESERVED_MINIMUM } from './reserved-usernames.fixture';

const SEEDS = [
  'youtube', 'instagram', 'founder', 'viral', 'for', 'in', 'on', 'at', 'feature', 'features',
  'tool', 'tools', 'about', 'internal', 'external', 'atelier',
];

describe('RESERVED_USERNAMES (AC-10)', () => {
  it('AC-10: is a map of lowercase, trimmed keys all set to true', () => {
    const entries = Object.entries(RESERVED_USERNAMES);
    expect(entries.length).toBeGreaterThan(500);
    for (const [key, value] of entries) {
      expect(key).toBe(key.trim().toLowerCase());
      expect(key).not.toBe('');
      expect(value).toBe(true);
    }
  });

  it('AC-10: contains every seed', () => {
    for (const seed of SEEDS) expect(RESERVED_USERNAMES).toHaveProperty([seed], true);
  });

  it('AC-10: contains every entry of the plan minimum list', () => {
    const missing: string[] = [];
    for (const [group, names] of Object.entries(PLAN_RESERVED_MINIMUM)) {
      for (const name of names) {
        if (!Object.hasOwn(RESERVED_USERNAMES, name)) missing.push(`${group}: ${name}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('AC-10: each group is sorted and free of duplicates', () => {
    for (const [group, names] of Object.entries(RESERVED_USERNAME_GROUPS)) {
      expect(new Set(names).size).toBe(names.length);
      const sorted = [...names].sort();
      expect({ group, names }).toEqual({ group, names: sorted });
    }
  });

  it('AC-10: the map is exactly the union of the groups, and frozen', () => {
    const union = new Set(Object.values(RESERVED_USERNAME_GROUPS).flat());
    expect(new Set(Object.keys(RESERVED_USERNAMES))).toEqual(union);
    expect(Object.isFrozen(RESERVED_USERNAMES)).toBe(true);
  });

  it('AC-10: every reserved name is rejected by the route gate, case-insensitively', () => {
    for (const name of Object.keys(RESERVED_USERNAMES)) {
      expect(isReservedUsername(name)).toBe(true);
      expect(isReservedUsername(name.toUpperCase())).toBe(true);
      expect(isArtistRouteSegment(name)).toBe(false);
    }
  });
});

/**
 * AC-11: the coverage walk. Every first-level URL segment the web app can serve must be reserved,
 * or a user could register a name that shadows a route (and the edge cache could store that
 * route's anonymous render). Read-only `fs` over the web app's source tree.
 */
const WEB_ROOT = path.resolve(__dirname, '../../../../../apps/web');
const APP_DIR = path.join(WEB_ROOT, 'src', 'app');
const LOCALE_DIR = path.join(APP_DIR, '[locale]');
const PUBLIC_DIR = path.join(WEB_ROOT, 'public');
const LOCALES = ['en', 'es', 'pt'];

/** Next special files: they never form a URL segment of their own. */
const SPECIAL_FILES = new Set([
  'layout', 'page', 'loading', 'error', 'global-error', 'not-found', 'template', 'default', 'route',
  'middleware', 'proxy', 'instrumentation',
]);

const stripExt = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
};

/** `(group)` folders are transparent; `_private`, `[dynamic]` and `@slot` ones are not static segments. */
const isRouteGroup = (name: string) => /^\(.+\)$/.test(name);
const isSkippable = (name: string) => name.startsWith('_') || name.startsWith('[') || name.startsWith('@');

/** First-level static segments under `dir`, looking through route groups. */
const firstLevelSegments = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (isRouteGroup(entry.name)) out.push(...firstLevelSegments(path.join(dir, entry.name)));
      else if (!isSkippable(entry.name)) out.push(stripExt(entry.name));
    } else if (!SPECIAL_FILES.has(stripExt(entry.name))) {
      // Metadata files (`robots.ts`, `sitemap.ts`, `manifest.ts`): the route is the basename.
      out.push(stripExt(entry.name));
    }
  }
  return out;
};

describe('RESERVED_USERNAMES route coverage (AC-11)', () => {
  it('AC-11: the web app source tree is where the test expects it', () => {
    // Fail loudly: a moved directory must not turn this walk into a silent no-op.
    expect(fs.existsSync(APP_DIR)).toBe(true);
    expect(fs.existsSync(LOCALE_DIR)).toBe(true);
    expect(fs.existsSync(PUBLIC_DIR)).toBe(true);
  });

  it('AC-11: every first-level route segment under [locale] is reserved', () => {
    const segments = firstLevelSegments(LOCALE_DIR);
    // Sanity: the walk saw the routes the plan names, so it is not vacuous.
    expect(segments).toEqual(
      expect.arrayContaining(['about', 'atelier', 'faqs', 'for', 'get-started', 'legal', 'support', 'artists', 'portfolios']),
    );
    expect(segments.filter((s) => !isReservedUsername(s))).toEqual([]);
  });

  it('AC-11: every top-level route, metadata route and file under src/app is reserved', () => {
    const segments = firstLevelSegments(APP_DIR);
    expect(segments).toEqual(
      expect.arrayContaining(['api', 'robots', 'sitemap', 'manifest', 'llms', 'og-image', 'indexnow-key', 'sitemap_index']),
    );
    expect(segments.filter((s) => !isReservedUsername(s))).toEqual([]);
  });

  it('AC-11: the named metadata route basenames are reserved', () => {
    for (const name of ['robots', 'sitemap', 'manifest', 'llms', 'og-image', 'indexnow-key', 'sitemap_index']) {
      expect(isReservedUsername(name)).toBe(true);
    }
  });

  it('AC-11: every public directory is reserved, and no public file can be shadowed by a username', () => {
    const entries = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true });
    expect(entries.length).toBeGreaterThan(0);
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    expect(dirs.length).toBeGreaterThan(0);
    expect(dirs.filter((d) => !isReservedUsername(d))).toEqual([]);
    // A file such as `favicon.ico` has a dot, which no username-shaped segment can contain, so the
    // route gate never treats it as an artist. A dotless public file would have to be reserved.
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    expect(files.filter((f) => isArtistRouteSegment(f))).toEqual([]);
  });

  it('AC-11: every supported locale prefix is reserved', () => {
    for (const locale of LOCALES) expect(isReservedUsername(locale)).toBe(true);
  });
});
