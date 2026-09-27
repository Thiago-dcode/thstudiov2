/**
 * SQL expression for the storage path an image sitemap / `og:image` should advertise for a media row.
 *
 * The full-resolution `url` is the canonical image (it is what JSON-LD `contentUrl` points at), so
 * Google Images should index that, not the `-thumbnail` derivative. A video's `url` is the MP4 and
 * is not an image at all — its poster `thumbnail` stands in.
 *
 * `alias` is interpolated verbatim, so it must be a trusted table alias, never input.
 */
export const sitemapImagePathSql = (alias: string): string =>
  `CASE WHEN ${alias}.media_type = 'VIDEO' THEN ${alias}.thumbnail ELSE COALESCE(${alias}.url, ${alias}.thumbnail) END`;
