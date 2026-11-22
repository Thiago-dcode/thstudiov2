import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { UserAuth } from '@repo/common-lib/types/auth';
import { Pagination } from '@repo/common-lib/types/response';
import { RequestLanguage, RequestLogContext, RequestStore } from '@repo/common-lib/types/request';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { requestLogContextOf, requestStorage } from './request-storage';
import { logService } from '@repo/backend-lib/config/logging';
import type { LogConfig } from '@repo/backend-lib/services/log-service';
import type { LogChannel } from '@repo/common-lib/types/log';

/** The api's logger: a `LogService` over the process buffer with the api's entry shape. */
export type ApiLogger = ReturnType<typeof logService.api>;

export type RequestLogOptions = {
  /** Default `operation` of every line of this logger; a call's own `operation` wins. */
  operation?: string;
  /** A fixed trace id (a Stripe event, say) instead of the current request's. */
  traceId?: string | null;
};


@Injectable()
export class RequestService {

  constructor(protected readonly storage: AsyncLocalStorage<RequestStore>) { }

  /**
   * Called once per request in the middleware to establish an isolated store. Loggers from
   * `log()` read its id and request context per line, and `traceCarrier()` carries the id into
   * every job the request enqueues.
   */
  async run(callback: (self: RequestService) => void): Promise<void> {
    const requestId = await generateUUID();
    this.storage.run(
      { requestId, user: null, language: null, user_agent: null, method: null, ip_address: null, path: null, pagination: null, unattributed_app_call: false, bearer_token: null },
      () => callback(this),
    );
  }

  private get store(): RequestStore | undefined {
    return this.storage.getStore();
  }

  /**
   * A new, immutable api logger bound to this request: the id and the HTTP context are functions,
   * so every line reads the store as it is then (the HTTP context after the middleware filled it
   * in). Outside HTTP (a job, a cron run) there is no request context. Build it once (constructor,
   * field, or a per-flow local), never per line.
   */
  log(channel: LogChannel, { operation, traceId }: RequestLogOptions = {}): ApiLogger {
    return logService.api({
      id: traceId !== undefined ? traceId : () => this.requestId,
      globalContext: () => this.logContext ?? undefined,
      // The channel is this project's concept, not the LogService's: it is just a default option.
      defaultOptions: operation ? { channel, operation } : { channel },
    });
  }

  /**
   * The trace carrier for `QueueHelper.*` / `enqueueJob(s)` / `runJobWithLogs({ log })` /
   * `logPermanentJobFailure`, so a job carries the trace id onward. Never `defaultOptions`, and
   * never an explicit `callback: undefined` (it would override the factory's critical mail).
   */
  traceCarrier(traceId?: string | null): Partial<LogConfig> {
    return {
      service: 'api',
      id: traceId !== undefined ? traceId : () => this.requestId,
      globalContext: () => this.logContext ?? undefined,
    };
  }

  get requestId(): string | null {
    return this.store?.requestId ?? null;
  }

  /** The HTTP request's log context, or `null` outside one (see `requestLogContextOf`). */
  get logContext(): RequestLogContext | null {
    return requestLogContextOf(this.store);
  }

  get method(): string | null {
    return this.store?.method ?? null;
  }
  set method(method: string | null) {
    if (this.store) this.store.method = method;
  }
  get user(): UserAuth | null {
    return this.store?.user ?? null;
  }
  set user(user: UserAuth | null) {
    if (this.store) this.store.user = user;
  }

  get bearer_token(): string | null {
    return this.store?.bearer_token ?? null;
  }
  set bearer_token(token: string | null) {
    if (this.store) this.store.bearer_token = token;
  }

  get viewer(): UserAuth | null | undefined {
    return this.store?.viewer;
  }
  set viewer(viewer: UserAuth | null) {
    if (this.store) this.store.viewer = viewer;
  }

  get language(): RequestLanguage | null {
    return this.store?.language ?? null;
  }
  set language(language: RequestLanguage) {
    if (this.store) this.store.language = language;
  }

  get user_agent(): string | null {
    return this.store?.user_agent ?? null;
  }
  set user_agent(user_agent: string) {
    if (this.store) this.store.user_agent = user_agent;
  }

  get ip_address(): string | null {
    return this.store?.ip_address ?? null;
  }
  set ip_address(ip_address: string) {
    if (this.store) this.store.ip_address = ip_address;
  }

  get path(): string | null {
    const store = this.store;
    if (!store) return null;
    return store.path_resolver ? store.path_resolver() : (store.path ?? null);
  }
  set path(path: string) {
    if (this.store) this.store.path = path;
  }
  /** See `RequestStore.path_resolver`: the middleware sets this so `path` is masked lazily. */
  set path_resolver(resolver: () => string | null) {
    if (this.store) this.store.path_resolver = resolver;
  }

  get unattributed_app_call(): boolean {
    return this.store?.unattributed_app_call ?? false;
  }
  set unattributed_app_call(value: boolean) {
    if (this.store) this.store.unattributed_app_call = value;
  }

  get pagination(): Pagination | null {
    return this.store?.pagination ?? null;
  }
  set pagination(pagination: Pagination | null) {
    if (this.store) this.store.pagination = pagination;
  }
}

/**
 * Non-DI twins of `RequestService.log` / `traceCarrier` over the process `requestStorage`: for
 * `main.ts`, cron locks, module-level constants and static fields, where there is no injection.
 */
export function apiLogger(channel: LogChannel, options?: RequestLogOptions): ApiLogger {
  return new RequestService(requestStorage).log(channel, options);
}

export function apiTraceCarrier(traceId?: string | null): Partial<LogConfig> {
  return new RequestService(requestStorage).traceCarrier(traceId);
}
