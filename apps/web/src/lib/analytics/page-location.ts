/**
 * What GA4 is allowed to see of a URL. Google's terms forbid personal data in hits, and some of our
 * URLs carry it: one-time tokens mailed to the visitor (in the path) and `?email=`, `?ref=`,
 * `?token=` (in the query). So every page view is sent with a rebuilt URL:
 * - the query keeps only campaign attribution (`utm_*`), everything else is dropped;
 * - the segment after a secret-bearing route is replaced by `:token`;
 * - the hash is dropped.
 *
 * ADDING A ROUTE WITH A SECRET IN THE PATH: add its parent segment to {@link SECRET_SEGMENT_PARENTS}.
 */

/** Segments whose NEXT segment is a secret, e.g. `/wait-list/<token>`, `/es/email-preferences/<token>`. */
const SECRET_SEGMENT_PARENTS = new Set(["wait-list", "email-preferences"]);

const isForwardedParam = (name: string) => name.startsWith("utm_");

export const sanitizePath = (pathname: string): string =>
  pathname
    .split("/")
    .map((segment, i, all) =>
      segment && i > 0 && SECRET_SEGMENT_PARENTS.has(all[i - 1] ?? "")
        ? ":token"
        : segment,
    )
    .join("/");

export const sanitizeQuery = (search: string): string => {
  const kept = new URLSearchParams();
  for (const [name, value] of new URLSearchParams(search)) {
    if (isForwardedParam(name)) kept.append(name, value);
  }
  const query = kept.toString();
  return query ? `?${query}` : "";
};

/** Same-origin URLs are sanitized; another site's URL is kept as the browser handed it over. */
export const sanitizeUrl = (href: string, origin: string): string => {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return "";
  }
  if (url.origin !== origin) return href;
  return `${url.origin}${sanitizePath(url.pathname)}${sanitizeQuery(url.search)}`;
};
