import { getConfigValue } from '@repo/common-lib/config/utils';
import { INDEXNOW_CANONICAL_HOST } from '@repo/common-lib/utils/indexnow';

/**
 * The canonical production origin (`https://a11studio.com`), or `null` anywhere else.
 *
 * Every environment runs with `NODE_ENV=production`, so the host check is what keeps dev from acting
 * on public URLs (announcing them to IndexNow, purging Cloudflare). Fail-closed like the web's
 * `isIndexableEnv()`: a missing or malformed `APP_URL` is not canonical.
 */
export const canonicalProductionOrigin = (): string | null => {
  const app = getConfigValue('app');
  if (!app.isProduction || !app.url) return null;
  try {
    const url = new URL(app.url);
    return url.host === INDEXNOW_CANONICAL_HOST ? url.origin : null;
  } catch {
    return null;
  }
};
