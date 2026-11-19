import path from 'node:path';
import { resolveMonorepoRoot } from '../../../utils/monorepo-root';

export { resolveMonorepoRoot };

/**
 * Default log directory: `<monorepo-root>/storage/logs`.
 * Override with `LOG_STORAGE_DIR` when the host mount path differs (e.g. custom Docker volumes).
 *
 * Resolved on call, never at import: the web image ships without `pnpm-workspace.yaml`, so the
 * monorepo walk throws there and must only run when `LOG_STORAGE_DIR` is missing.
 */
export function resolveDefaultLogFolder(): string {
  const fromEnv = process.env.LOG_STORAGE_DIR?.trim();
  if (fromEnv) return fromEnv;

  try {
    return path.join(resolveMonorepoRoot(), 'storage', 'logs');
  } catch {
    // No workspace file reachable from `__dirname` (a Turbopack bundle rewrites it). Every app
    // runs from `apps/<app>` or `packages/<pkg>`, so the repo's `storage/logs` is two levels up.
    return path.resolve(process.cwd(), '..', '..', 'storage', 'logs');
  }
}
