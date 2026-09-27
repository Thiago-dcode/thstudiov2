import { TABLES_ENUM } from '../constants/enums';

/**
 * Whether an artist profile is complete enough to be shared and indexed as a real artist page.
 *
 * All four signals are required (strict AND): a share card or a search result built from a profile
 * that is still being filled in reads as a finished portfolio and cannot be un-cached once a
 * messenger or crawler has seen it. The same predicate gates the sitemap enumeration, so discovery
 * and per-page robots can never disagree.
 */
export type ArtistShareReadyInput = {
  name?: string | null;
  profession?: string | null;
  city?: string | null;
  state?: string | null;
  /** At least one portfolio that is active, indexable and not blocked. */
  has_public_portfolio: boolean;
};

const isFilled = (value?: string | null): boolean => Boolean(value?.trim());

export function isArtistShareReady(input: ArtistShareReadyInput): boolean {
  return (
    input.has_public_portfolio &&
    isFilled(input.name) &&
    isFilled(input.profession) &&
    // Either half of the locality is enough — the visible summary and JSON-LD both fall back to state.
    (isFilled(input.city) || isFilled(input.state))
  );
}

/** Roles whose profiles are public artist pages (support/staff accounts are not). */
export const PUBLIC_PROFILE_ROLE_NAMES = ['ARTIST', 'ADMIN'] as const;

/**
 * SQL mirror of {@link isArtistShareReady} as a self-contained `EXISTS (…)` clause, for any query
 * that reaches an artist through a user-id column (`p.user_id`, `m.user_id`, …).
 *
 * Every public surface of an artist — the profile, its portfolios, collections, services and media,
 * the sitemap shards that enumerate them — must answer "is this artist public?" identically.
 * Otherwise an incomplete profile is `noindex` while its portfolios are advertised, which is exactly
 * the disagreement the share-ready gate exists to prevent. Also excludes banned/deactivated
 * accounts and non-artist roles (support).
 *
 * `userIdExpr` is interpolated verbatim, so it must be a trusted column reference, never input.
 */
export const artistShareReadySql = (userIdExpr: string): string => `EXISTS (
    SELECT 1 FROM ${TABLES_ENUM.USERS} sr_u
    INNER JOIN ${TABLES_ENUM.ROLES} sr_r ON sr_r.id = sr_u.role_id
    WHERE sr_u.id = ${userIdExpr}
      AND sr_r.name IN (${PUBLIC_PROFILE_ROLE_NAMES.map((r) => `'${r}'`).join(', ')})
      AND sr_u.banned = false AND sr_u.is_active = true
      AND BTRIM(COALESCE(sr_u.name, '')) <> ''
      AND BTRIM(COALESCE(sr_u.profession, '')) <> ''
      AND EXISTS (
        SELECT 1 FROM ${TABLES_ENUM.ADDRESSES} sr_a
        WHERE sr_a.user_id = sr_u.id
          AND (BTRIM(COALESCE(sr_a.city, '')) <> '' OR BTRIM(COALESCE(sr_a.state, '')) <> '')
      )
      AND EXISTS (
        SELECT 1 FROM ${TABLES_ENUM.PORTFOLIOS} sr_p
        WHERE sr_p.user_id = sr_u.id AND sr_p.blocked_at IS NULL
          AND sr_p.is_active = true AND sr_p.is_indexable = true
      )
  )`;
