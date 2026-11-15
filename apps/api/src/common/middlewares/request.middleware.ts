import { AsyncResource } from 'node:async_hooks';
import { performance } from 'node:perf_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { RequestService } from 'src/common/services/request.service';
import { safeEqual } from 'src/common/utils/safe-equal';
import { ENUMS } from '@repo/common-lib/constants/enums';
import { EnumType } from '@repo/common-lib/constants/enums';
import { getAcceptLanguage } from '@repo/common-lib/utils/get-accept-language';
import {
  LANGUAGE_HEADER,
  DEFAULT_LANGUAGE,
} from '@repo/common-lib/constants/language';
import {
  REQUEST_START_TIME,
  USER_AGENT_HEADER,
  USER_AGENT_MAX_LENGTH,
  IP_ADDRESS_HEADER,
  APP_TOKEN_HEADER,
} from '@repo/common-lib/constants/headers';
import {
  FactoryLogService,
  LogService,
  redactRoutePath,
} from '@repo/backend-lib/services/log-service';
const AVAILABLE_LANGUAGES = ENUMS.LANGUAGE_CODE;

export const ACCESS_LOG_CHANNEL = 'api.access' as const;
/**
 * Paths whose successful requests write no access line. The docker healthcheck
 * (`compose.prod.yaml`) polls `GET /` every 30 s per replica; a failing `/` is still logged.
 */
export const ACCESS_LOG_SKIP_PATHS: ReadonlySet<string> = new Set(['/']);

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  /**
   * Its own instance, not the DI `LogService`: builder calls mutate config, and the shared one
   * is used by every request at once.
   */
  private readonly accessLog: LogService;

  constructor(
    private readonly requestService: RequestService,
    private readonly configService: ConfigService,
  ) {
    this.accessLog = FactoryLogService.createLogService('file', {
      channel: ACCESS_LOG_CHANNEL,
      ...requestService.logBinding(),
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    await this.requestService.run(() => {
      const startedAt = performance.now();
      // Never the query string: it can carry one-time tokens (email verification, recovery).
      const path = (req.originalUrl ?? req.url ?? '').split('?')[0];
      this.requestService.method = req.method;
      // Path params can be secrets too (`/email-preferences/:token/token`). They are only known
      // once Express matches the route, so the logged path is resolved on every read: `null`
      // before routing and for unmatched paths, sensitive param values masked after.
      this.requestService.path_resolver = () =>
        redactRoutePath(
          path,
          (req.route as { path?: string } | undefined)?.path,
          req.params as Record<string, unknown> | undefined,
        );
      req.headers[REQUEST_START_TIME] = Date.now().toString();
      // `close` listeners don't reliably run in the request's AsyncLocalStorage context; binding
      // keeps `requestService.log` pointing at this request (including the user AuthGuard sets).
      res.once(
        'close',
        AsyncResource.bind(() => this.logCompletion(req, res, path, startedAt)),
      );

      //Priority 1: Query Param
      const { lan }: { lan?: string } = req.query;
      let language: EnumType<'LANGUAGE_CODE'> | undefined | null =
        lan?.toUpperCase() as EnumType<'LANGUAGE_CODE'>;

      if (!language || !AVAILABLE_LANGUAGES.includes(language)) {
        //Priority 2: custom header
        language = req.headers[LANGUAGE_HEADER] as EnumType<'LANGUAGE_CODE'>;
        if (!language || !AVAILABLE_LANGUAGES.includes(language)) {
          //Priority 3: accept-language header
          language = getAcceptLanguage(
            req.headers?.['accept-language'],
          ) as EnumType<'LANGUAGE_CODE'>;
          if (!language || !AVAILABLE_LANGUAGES.includes(language)) {
            //Priority 4: default language
            language = DEFAULT_LANGUAGE;
          }
        }
      }

      res.setHeader(LANGUAGE_HEADER, language);
      req.headers[LANGUAGE_HEADER] = language;
      this.requestService.language = language;

      // The custom `x-app-user-agent` / `x-app-ip-address` headers exist so our own
      // Next.js server can forward the *end user's* identity when it proxies a call
      // (otherwise every request would look like it came from the web container).
      //
      // They must only be honoured for that trusted caller. Any client can set them,
      // and `user_agent` + `ip_address` are what UserAuthDevicesService matches on to
      // decide a device is already trusted — so honouring them unconditionally let an
      // attacker with a stolen password replay a victim's trusted device and skip 2FA.
      const appToken = req.get(APP_TOKEN_HEADER);
      const expectedAppToken = this.configService.get<string>('app.token');
      const isTrustedCaller =
        !!expectedAppToken && !!appToken && safeEqual(appToken, expectedAppToken);

      this.requestService.user_agent = (
        (isTrustedCaller ? req.get(USER_AGENT_HEADER) : undefined) ||
        req.get('user-agent') ||
        '-'
      ).slice(0, USER_AGENT_MAX_LENGTH);
      // `req.ip` already resolves X-Forwarded-For correctly via `trust proxy` (main.ts).
      const forwardedIp = isTrustedCaller ? req.get(IP_ADDRESS_HEADER) : undefined;
      this.requestService.ip_address = forwardedIp || req.ip || '-';
      // Public SSR reads deliberately omit the visitor IP (stable fetch-cache keys), so their
      // `ip_address` is the web container's. `AppThrottlerGuard` must not bucket on it.
      this.requestService.unattributed_app_call = isTrustedCaller && !forwardedIp;

      // Kept for `PublicViewerService`: public reads show owners and admins what visitors can't.
      const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
      this.requestService.bearer_token = scheme === 'Bearer' && token ? token : null;

      next();
    });
  }

  /**
   * One line per request on `api.access`, also for guard rejections, unknown routes and handler
   * errors that never reach an interceptor. No body, params, query or headers: the error filter
   * already writes the detail on `api.error`.
   */
  private logCompletion(req: Request, res: Response, path: string, startedAt: number): void {
    try {
      const status_code = res.statusCode;
      const aborted = !res.writableFinished;
      if (status_code < 400 && !aborted && ACCESS_LOG_SKIP_PATHS.has(path)) return;

      // The Express route template Nest registered (`/v1/media/:id`), so the message stays
      // low-cardinality. Absent for unmatched paths.
      const route: string | null = req.route?.path ?? null;
      const message = `${req.method} ${route ?? 'unmatched'} ${status_code}`;
      const extraInfo = {
        route,
        status_code,
        duration_ms: Math.round(performance.now() - startedAt),
        aborted,
      };
      if (status_code >= 500) this.accessLog.error(message, extraInfo, { status_code });
      else if (status_code >= 400 || aborted) this.accessLog.warn(message, extraInfo, { status_code });
      else this.accessLog.info(message, extraInfo, { status_code });

      // In process, not on LOG_QUEUE: with several replicas a queued flush can be consumed by
      // one that doesn't hold this buffer. The response is already sent, so no client latency.
      void LogService.flush().catch((flushErr) =>
        console.error('Failed to flush access logs:', flushErr),
      );
    } catch (error) {
      console.error('Failed to write access log:', error);
    }
  }
}
