import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UnrecoverableError } from 'bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { EDGE_PURGE_LOCALE_PREFIXES } from '@repo/common-lib/constants/edge-cache';
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from '@repo/common-lib/constants/events';
import { canonicalProductionOrigin } from 'src/common/utils/canonical-origin';
import { ArtistPublicPagesChangedEvent } from './events/artist-public-pages-changed.event';

/** Cloudflare's per-request cap on purge-by-prefix. */
export const MAX_PREFIXES_PER_REQUEST = 100;

/** The only usernames ever sent: what the web's edge-cache allowlist accepts. */
const USERNAME_PATTERN = /^[a-z0-9_-]+$/;

const PURGE_TIMEOUT_MS = 10_000;

export type EdgePurgeTarget = { host: string; zoneId: string; token: string };
export type EdgePurgeSkip = { skip: string };

type CloudflareResponse = { success?: boolean; errors?: { code?: number }[] };

/**
 * Edge purges of an artist's public pages. The listener only enqueues (debounced per artist, see
 * `QueueHelper.createPurgeArtistEdgeCacheJob`); `EdgeCacheProcessor` resolves the names and calls
 * the helpers below. Only the canonical production origin with both Cloudflare settings ever sends
 * a request; everywhere else the job completes with a skip log.
 */
@Injectable()
export class EdgeCacheService {
  constructor(private readonly logger: LogService) {}

  /**
   * Never throws: a purge is an optimisation (the edge TTL is the fallback), so a Redis outage
   * must not fail the request that changed the page.
   */
  @OnEvent(ARTIST_PUBLIC_PAGES_CHANGED_EVENT)
  async handleArtistPublicPagesChanged(event: ArtistPublicPagesChangedEvent): Promise<void> {
    try {
      await QueueHelper.createPurgeArtistEdgeCacheJob({
        user_id: event.userId,
        ...(event.usernames?.length ? { usernames: event.usernames } : {}),
      });
    } catch (error) {
      this.logger
        .name('enqueue')
        .error(
          `Could not enqueue the edge purge of user [${event.userId}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      // In-process: a queued flush would need the Redis that just failed.
      await LogService.flush().catch(() => undefined);
    }
  }

  /** The gate. Fail-closed: anything but the canonical production origin with both settings skips. */
  purgeTarget(): EdgePurgeTarget | EdgePurgeSkip {
    const origin = canonicalProductionOrigin();
    if (!origin) return { skip: 'not canonical production origin' };
    const { apiToken, zoneId } = getConfigValue('cloudflare');
    if (!apiToken) return { skip: 'CLOUDFLARE_API_TOKEN missing' };
    if (!zoneId) return { skip: 'CLOUDFLARE_ZONE_ID missing' };
    return { host: new URL(origin).host, zoneId, token: apiToken };
  }

  /**
   * One prefix per name and locale (`a11studio.com[/es|/pt]/artists/{name}`): no scheme, no query
   * and no trailing slash, so it covers the profile, every sub-page and every query-string variant.
   * It also covers `/artists/{name}*` (`ana` purges `anabel`), which only costs a cache miss.
   * Names are lowercased and deduplicated; one that is not a valid username is dropped, never sent.
   */
  buildPrefixes(
    host: string,
    names: unknown[],
  ): { chunks: string[][]; names: number; dropped: number } {
    const valid = new Set<string>();
    let dropped = 0;
    for (const raw of names) {
      const name = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
      if (USERNAME_PATTERN.test(name)) valid.add(name);
      else dropped++;
    }
    const prefixes = [...valid].flatMap((name) =>
      EDGE_PURGE_LOCALE_PREFIXES.map((locale) => `${host}${locale}/artists/${name}`),
    );
    const chunks: string[][] = [];
    for (let i = 0; i < prefixes.length; i += MAX_PREFIXES_PER_REQUEST) {
      chunks.push(prefixes.slice(i, i + MAX_PREFIXES_PER_REQUEST));
    }
    return { chunks, names: valid.size, dropped };
  }

  /**
   * One purge request. Throws a plain `Error` on what may pass (429, 5xx, network error, timeout) so
   * BullMQ retries with backoff, and `UnrecoverableError` on what will not (any other 4xx, or a 2xx
   * without `success: true`), so a bad token or zone does not burn the shared rate budget. Errors
   * and logs carry the status and Cloudflare's error codes only: never the token or headers.
   */
  async purgePrefixes(target: EdgePurgeTarget, prefixes: string[]): Promise<void> {
    let res: Response;
    try {
      res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(target.zoneId)}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${target.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefixes }),
          signal: AbortSignal.timeout(PURGE_TIMEOUT_MS),
        },
      );
    } catch (error) {
      // The cause is dropped on purpose: only its kind is reported, so nothing from the request
      // (headers included) can end up in a log through the error.
      const reason =
        error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
          ? 'timed out'
          : 'network error';
      // eslint-disable-next-line preserve-caught-error -- the cause is dropped on purpose (see above)
      throw new Error(`Cloudflare purge ${reason}, will retry`);
    }

    const body = (await res.json().catch(() => null)) as CloudflareResponse | null;
    const codes = (Array.isArray(body?.errors) ? body.errors : [])
      .map((error) => error?.code)
      .filter((code): code is number => typeof code === 'number');
    const detail = `HTTP ${res.status}${codes.length ? `, Cloudflare errors ${codes.join(',')}` : ''}`;

    if (res.status === 429 || res.status >= 500) {
      throw new Error(`Cloudflare purge failed, will retry (${detail})`);
    }
    if (!res.ok || body?.success !== true) {
      const message = `Cloudflare purge rejected, not retried (${detail})`;
      // Logged here: `GlobalProcessor` only logs a job that used up its attempts, and an
      // unrecoverable failure stops after the first one.
      this.logger.name('purge').error(message);
      throw new UnrecoverableError(message);
    }
  }
}
