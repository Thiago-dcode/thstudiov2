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

export type IndexNowResult =
  | { status: 'skipped'; reason: string }
  | { status: 'submitted'; urls: number; httpStatus: number };

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
    // 200 = accepted, 202 = accepted while the key is being validated. Anything else is logged.
    return { status: 'submitted', urls: urlList.length, httpStatus: res.status };
  }
}
