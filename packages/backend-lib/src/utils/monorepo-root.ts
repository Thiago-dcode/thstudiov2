/**
 * Side-effect free: importing this never touches the filesystem. `paths.ts` resolves the root at
 * import time, which throws in a process shipped without `pnpm-workspace.yaml` (the Next
 * standalone web image), so anything the web app loads must use this module instead.
 */
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
