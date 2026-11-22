import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import {
  logService,
  setLogProcessService,
  type WebLogger,
} from "@repo/backend-lib/config/logging";
import type { WebLogContext } from "@repo/common-lib/types/log";

/**
 * The web app's logger: channel `web`, same JSON lines as the api. The only entry point web code
 * uses for `@repo/backend-lib` logging. `server-only` makes a Client Component import fail the
 * build instead of shipping Node APIs to the browser.
 *
 * Lines are pushed to the shared Redis log buffer (`logs:pending`, client built on the first line);
 * the worker's scheduled flush writes them to `storage/logs/web/<date>.log`. Nothing is flushed
 * here. A `critical` line mails the admins (the factory's `emailCritical` callback), like api/worker ones.
 *
 * Self-contained on purpose: Turbopack puts a separate copy of this module (and of backend-lib) in
 * each server bundle, so the setup runs HERE, at module load, in every copy. The buffer and the
 * process service live on `globalThis`, so every copy shares them.
 */
setLogProcessService("web");

/**
 * The current `withLogTrace` run's trace id and context. Module-local, next to the logger that
 * reads it. One store per run, so overlapping requests never see each other's values.
 */
const traceStore = new AsyncLocalStorage<{
  traceId: string;
  context: WebLogContext;
}>();

/**
 * Shared across requests, so the id and the `request` context are read per line from the
 * `withLogTrace` store, never set on the logger. Pass the flow per call in the options
 * (`{ ...extra, operation: "oauth-initiate" }`); there is no 3rd argument.
 */
export const webLogger: WebLogger = logService.web({
  id: () => traceStore.getStore()?.traceId ?? null,
  globalContext: () => traceStore.getStore()?.context,
  defaultOptions: { channel: "web" },
});

/**
 * Runs `fn` under a fresh trace id, so every line it logs (across awaits) shares one `id` and
 * can be followed in Grafana. Wrap a server action's or route handler's body with it. A line
 * logged outside it has no id and no `request`.
 *
 * `context` becomes the line's `request`: `{ kind: "action" }`, or for a route handler its method
 * and route PATTERN as written in the app dir (never the requested URL, query, headers or cookies).
 */
export function withLogTrace<T>(
  fn: () => Promise<T>,
  context: WebLogContext,
): Promise<T> {
  return traceStore.run({ traceId: randomUUID(), context }, fn);
}

/** For `extraInfo`: the error's class name, never its message (it can carry user input). */
export function errorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
