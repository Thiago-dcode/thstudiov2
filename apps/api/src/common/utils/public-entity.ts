/**
 * What a visitor may see of a collection, portfolio or service: switched on by its owner and not
 * blocked by moderation. Owners and admins see the rest (see `PublicViewerService.canSeeHidden`).
 */
export const PUBLIC_ENTITY_FILTERS = { is_active: true, blocked: false } as const;

/**
 * SQL mirror of `PUBLIC_ENTITY_FILTERS` for a raw query on `alias`: what an artist's public section
 * page lists. The only place this pair is written for counts (`LISTED_*_PREDICATE`); not the SEO
 * `PUBLIC_*_PREDICATE`. `alias` must be a trusted literal, never request input.
 */
export const listedEntitySql = (alias: string): string =>
  `${alias}.blocked_at IS NULL AND ${alias}.is_active = true`;

/**
 * Ceiling for an anonymous list read that skips pagination (`paginated=false`): without it one
 * request scans and signs every row on the platform. Far above any page that reads unpaginated
 * (the landing's value pillars hold a handful).
 */
export const PUBLIC_UNPAGINATED_MAX_ROWS = 100;

export { isHiddenFromPublic } from '@repo/common-lib/utils/public-entity';
