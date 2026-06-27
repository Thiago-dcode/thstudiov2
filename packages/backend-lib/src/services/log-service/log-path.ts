import fs from 'node:fs';
import path from 'node:path';

const MONOREPO_MARKER = 'pnpm-workspace.yaml';

/**
 * Walks up from `fromDir` until it finds the monorepo root (`pnpm-workspace.yaml`).
 * Works from compiled `dist/` paths and from `src/` during local dev — no fragile `..` counts.
 */
export function resolveMonorepoRoot(fromDir: string = __dirname): string {
  let dir = fromDir;

  while (true) {
    if (fs.existsSync(path.join(dir, MONOREPO_MARKER))) {
      return dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Monorepo root not found (no ${MONOREPO_MARKER} in parent directories of ${fromDir})`,
      );
    }
    dir = parent;
  }
}

/**
 * Default log directory: `<monorepo-root>/storage/logs`.
 * Override with `LOG_STORAGE_DIR` when the host mount path differs (e.g. custom Docker volumes).
 */
export function resolveDefaultLogFolder(): string {
  const fromEnv = process.env.LOG_STORAGE_DIR?.trim();
  if (fromEnv) return fromEnv;

  return path.join(resolveMonorepoRoot(), 'storage', 'logs');
}
