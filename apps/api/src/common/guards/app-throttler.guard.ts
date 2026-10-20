import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { RequestService } from 'src/common/services/request.service';

/**
 * Rate-limits by the *end user*, not by whoever opened the TCP connection.
 *
 * The stock guard keys on `req.ip`. That is correct for browser traffic arriving
 * through nginx, but the Next.js server calls us directly at `http://api:8080`
 * over the Docker network (see `API_V1_URL` in compose) — no nginx hop, so no
 * `X-Forwarded-For`. Every SSR request therefore looked like the *same* client,
 * and all visitors of the site shared a single bucket: once the site served ~75
 * landing pages in a minute, every subsequent visitor got a 429.
 *
 * `RequestService.ip_address` already resolves this correctly: `RequestMiddleware`
 * honours the forwarded `x-app-ip-address` only when the caller proves it is our
 * own server (matching `APP_TOKEN_HEADER`), and otherwise falls back to `req.ip`.
 * Reusing it keeps that trust decision in one place instead of duplicating — and
 * eventually drifting from — the check.
 *
 * Reading it from a guard is safe: `RequestService` is a plain singleton over an
 * `AsyncLocalStorage`, and the middleware calls `next()` inside `storage.run(...)`,
 * so the store is live here. `AuthGuard` already relies on the same thing.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly requestService: RequestService,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Public SSR reads come from our web server without the visitor's IP, so the only key
   * available is the web container itself. Counting them there let one anonymous client
   * spend the shared budget and turn every visitor's artist pages into 404s. The visitor
   * was already rate-limited per IP by nginx before reaching Next, so these calls skip
   * the per-client limit here instead of sharing one bucket.
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (this.requestService.unattributed_app_call) return true;
    return super.shouldSkip(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const resolved = this.requestService.ip_address;
    // The middleware writes '-' when it has nothing better; treat that as absent
    // so we fall through to `req.ip` rather than bucketing everyone under '-'.
    const candidate =
      resolved && resolved !== '-' ? (resolved.split(',')[0] ?? '').trim() : '';

    return candidate || req.ip || 'unknown';
  }
}
