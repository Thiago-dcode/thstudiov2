/**
 * Cache-buster for the files in `apps/web/public/` that browsers and Cloudflare cache under a
 * stable URL (favicon, apple-touch icon, PWA icons). Bump it whenever any of those images change,
 * otherwise visitors keep the old icon (browsers cache favicons far more aggressively than pages).
 */
const ICON_VERSION = "2";

/** `/favicon.ico` -> `/favicon.ico?v=2`. */
export function iconUrl(path: string): string {
  return `${path}?v=${ICON_VERSION}`;
}
