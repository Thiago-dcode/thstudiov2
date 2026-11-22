/**
 * Public portfolio page path, without a locale prefix: render it through the i18n `Link`,
 * which adds the locale.
 */
export const artistPortfolioPath = (username: string, slug: string): string =>
  `/artists/${encodeURIComponent(username)}/portfolios/${encodeURIComponent(slug)}`;

/**
 * Public collection page path, without a locale prefix: render it through the i18n `Link`,
 * which adds the locale.
 */
export const artistCollectionPath = (username: string, slug: string): string =>
  `/artists/${encodeURIComponent(username)}/collections/${encodeURIComponent(slug)}`;

/**
 * Public service page path, without a locale prefix: render it through the i18n `Link`,
 * which adds the locale.
 */
export const artistServicePath = (username: string, slug: string): string =>
  `/artists/${encodeURIComponent(username)}/services/${encodeURIComponent(slug)}`;
