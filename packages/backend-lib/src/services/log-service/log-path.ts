import path from 'node:path';

/**
 * Default log directory under `packages/backend-lib/storage/logs`.
 * Resolved from this module's location (not `process.cwd()`), so it works when
 * the API runs from `/workspace` in Docker as well as from `apps/api` locally.
 */
export function resolveDefaultLogFolder(): string {
  const fromEnv = process.env.LOG_STORAGE_DIR?.trim();
  if (fromEnv) return fromEnv;

  // dist/src/services/log-service → backend-lib/storage/logs
  return path.resolve(__dirname, '..', '..', '..', '..', 'storage', 'logs');
}
