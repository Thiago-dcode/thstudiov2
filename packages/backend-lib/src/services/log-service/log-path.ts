import path from 'node:path';
import { resolveMonorepoRoot, storageDirectory } from '../../utils/paths';

export { resolveMonorepoRoot };

/**
 * Default log directory: `<monorepo-root>/storage/logs`.
 * Override with `LOG_STORAGE_DIR` when the host mount path differs (e.g. custom Docker volumes).
 */
export function resolveDefaultLogFolder(): string {
  const fromEnv = process.env.LOG_STORAGE_DIR?.trim();
  if (fromEnv) return fromEnv;

  return path.join(storageDirectory, 'logs');
}
