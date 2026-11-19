import { AsyncLocalStorage } from 'async_hooks';
import { RequestLogContext, RequestStore } from '@repo/common-lib/types/request';

/**
 * The api's one request store: an HTTP request, a processor job or a cron run each get their own
 * (`RequestService.run`, `runWithTraceId`). Loggers read the trace id and request context from it
 * per line, so a shared logger never holds per-request state.
 */
export const requestStorage = new AsyncLocalStorage<RequestStore>();

/** The trace id of the current request, job or cron run, or `null` outside one. */
export function currentRequestId(): string | null {
  return requestStorage.getStore()?.requestId ?? null;
}

/**
 * The log context of `store`, or `null` outside HTTP (no store, or a job/cron store, which has
 * no `method`). Built field by field from an allow-list, never by spreading the store: it holds
 * `bearer_token` and the user's token/email.
 */
export function requestLogContextOf(store: RequestStore | undefined): RequestLogContext | null {
  if (!store || !store.method) return null;
  const user = store.user ?? store.viewer ?? null;
  return {
    id: store.requestId,
    method: store.method ?? null,
    path: store.path_resolver ? store.path_resolver() : (store.path ?? null),
    ip_address: store.ip_address ?? null,
    user_agent: store.user_agent ?? null,
    user_id: user?.id ?? null,
    user_role: user?.role?.name ?? null,
    language: store.language ?? null,
    unattributed_app_call: store.unattributed_app_call ?? false,
  };
}

/** The current HTTP request's log context (see `requestLogContextOf`). */
export function currentRequestLogContext(): RequestLogContext | null {
  return requestLogContextOf(requestStorage.getStore());
}

/** Runs `fn` in a fresh store whose trace id is `id` (a job or cron run: no HTTP fields). */
export function runWithTraceId<T>(id: string, fn: () => T): T {
  return requestStorage.run(
    {
      requestId: id,
      user: null,
      language: null,
      user_agent: null,
      method: null,
      ip_address: null,
      path: null,
      pagination: null,
      unattributed_app_call: false,
      bearer_token: null,
    },
    fn,
  );
}
