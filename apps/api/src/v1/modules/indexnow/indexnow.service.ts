import { Injectable } from '@nestjs/common';
import { getConfigValue } from '@repo/common-lib/config/utils';
import {
  deriveIndexNowKey,
  INDEXNOW_CANONICAL_HOST,
  INDEXNOW_KEY_PATH,
} from '@repo/common-lib/utils/indexnow';
import { IndexNowRepository } from './indexnow.repository';

/** IndexNow's shared endpoint: one submission reaches every participating engine. */
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
/** Protocol maximum per request. */
const MAX_URLS_PER_REQUEST = 10_000;
/** Every page exists at `/`, `/es` and `/pt`; each locale is its own URL to engines. */
const LOCALE_PREFIXES = ['', '/es', '/pt'] as const;

/**
 * Pages per run whose share image is pre-generated. Each costs ~1–2 s of CPU on the web container
 * (1 vCPU), so a burst of edits is capped and the rest are generated on first share as before.
 */
const MAX_SHARE_IMAGES_PER_RUN = 50;
/** A social scraper UA, so the page answers with its metadata in <head> exactly as WhatsApp sees it. */
/**
 * Pause between pages. The warm-up renders pages from the droplet's own IP, and each render makes
 * several API calls under the per-IP throttle (20 per 10 s, 75 per minute); a page every 6 s stays
 * well inside it. 50 pages take ~5 minutes, far within the hourly lock.
 */
const SHARE_IMAGE_PAUSE_MS = 6_000;
const SHARE_PREVIEW_UA = 'facebookexternalhit/1.1 (+a11studio share-image warmup)';

export type IndexNowResult =
  | { status: 'skipped'; reason: string }
  | {
      status: 'submitted';
      urls: number;
      httpStatus: number;
      /** Changed pages whose share image is now generated and cached at the edge. */
      warmedImages: number;
    };

/**
 * Tells IndexNow engines (Bing — which also feeds ChatGPT search, Copilot and DuckDuckGo —
 * Yandex, Seznam, Naver) which public pages changed, so they recrawl in minutes instead of whenever
 * their crawler next passes. Google does not take part in IndexNow; the sitemap covers it.
 */
@Injectable()
export class IndexNowService {
  constructor(private readonly indexNowRepository: IndexNowRepository) {}

  /**
   * Only the canonical production origin submits. Every environment runs with
   * `NODE_ENV=production`, so the host check is what keeps dev from announcing its URLs (the same
   * fail-closed rule as the web's `isIndexableEnv()`).
   */
  private canonicalOrigin(): string | null {
    const app = getConfigValue('app');
    if (!app.isProduction || !app.url || !app.token) return null;
    try {
      const url = new URL(app.url);
      return url.host === INDEXNOW_CANONICAL_HOST ? url.origin : null;
    } catch {
      return null;
    }
  }

  async submitChangedSince(since: Date): Promise<IndexNowResult> {
    const origin = this.canonicalOrigin();
    if (!origin) return { status: 'skipped', reason: 'not the canonical production origin' };

    const perLocale = Math.floor(MAX_URLS_PER_REQUEST / LOCALE_PREFIXES.length);
    const paths = await this.indexNowRepository.changedPathsSince(since, perLocale);
    if (!paths.length) return { status: 'skipped', reason: 'nothing changed' };

    const urlList = paths.flatMap((path) =>
      LOCALE_PREFIXES.map((prefix) => `${origin}${prefix}${path}`),
    );
    const key = deriveIndexNowKey(getConfigValue('app').token);

    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(origin).host,
        key,
        keyLocation: `${origin}${INDEXNOW_KEY_PATH}`,
        urlList,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const warmedImages = await this.warmShareImages(origin, paths);
    // 200 = accepted, 202 = accepted while the key is being validated. Anything else is logged.
    return { status: 'submitted', urls: urlList.length, httpStatus: res.status, warmedImages };
  }

  /**
   * Generates the share image (`/og-image.jpg`) of each changed page now, through the public origin
   * so Cloudflare caches it. Otherwise the FIRST person to share a new page on WhatsApp waits the
   * 1–2 s it takes to render the 1200×630 card, and WhatsApp shows a bare link meanwhile. The image
   * URL is the same for every locale, so the English page is enough. Sequential on purpose (the web
   * container has one CPU), and best-effort: a failure only means that card renders on first share.
   */
  private async warmShareImages(origin: string, paths: string[]): Promise<number> {
    let warmed = 0;
    for (const [i, path] of paths.slice(0, MAX_SHARE_IMAGES_PER_RUN).entries()) {
      if (i > 0) await new Promise((resolve) => setTimeout(resolve, SHARE_IMAGE_PAUSE_MS));
      try {
        const page = await fetch(`${origin}${path}`, {
          headers: { 'User-Agent': SHARE_PREVIEW_UA },
          signal: AbortSignal.timeout(15_000),
        });
        if (!page.ok) continue;
        const html = await page.text();
        const match = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (!match) continue;
        const image = match[1].replace(/&amp;/g, '&');
        // Only our own card route: a page whose og:image is the static default has nothing to warm.
        if (!image.startsWith(`${origin}/og-image.jpg`)) continue;
        const res = await fetch(image, {
          headers: { 'User-Agent': SHARE_PREVIEW_UA },
          signal: AbortSignal.timeout(30_000),
        });
        await res.arrayBuffer();
        if (res.ok) warmed++;
      } catch {
        // Best-effort; see above.
      }
    }
    return warmed;
  }
}
