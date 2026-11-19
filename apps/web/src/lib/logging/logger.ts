import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import {
  logService,
  setLogProcessService,
} from "@repo/backend-lib/config/logging";

/**
 * The web app's logger: channel `web`, same JSON lines as the api. The only entry point web code
 * uses for `@repo/backend-lib` logging. `server-only` makes a Client Component import fail the
 * build instead of shipping Node APIs to the browser.
 *
 * Lines are pushed to the shared Redis log buffer (`logs:pending`, client built on the first line);
 * the worker's scheduled flush writes them to `storage/logs/web/<date>.log`. Nothing is flushed
 * here. A `critical` line mails the admins (the `web` config's callback), like api/worker ones.
 *
 * Self-contained on purpose: Turbopack puts a separate copy of this module (and of backend-lib) in
 * each server bundle, so the setup runs HERE, at module load, in every copy. The buffer and the
 * process service live on `globalThis`, so every copy shares them.
 */
setLogProcessService("web");

/** The current `withLogTrace` run's id. Module-local, next to the logger that reads it. */
const traceStore = new AsyncLocalStorage<string>();

/**
 * Shared across requests, so never call `.name()`/`.request()` on it: pass the flow per call
 * (`{ operation: "oauth-initiate" }` as the 3rd argument). The id is read per line.
 */
export const webLogger = logService.web({
  id: () => traceStore.getStore() ?? null,
});

/**
 * Runs `fn` under a fresh trace id, so every line it logs (across awaits) shares one `id` and
 * can be followed in Grafana. Wrap a server action's or route handler's body with it. A line
 * logged outside it has no id.
 */
export function withLogTrace<T>(fn: () => Promise<T>): Promise<T> {
  return traceStore.run(randomUUID(), fn);
}

/** For `extraInfo`: the error's class name, never its message (it can carry user input). */
export function errorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
