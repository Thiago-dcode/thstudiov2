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
 * Canonical filesystem layout shared by the backend packages.
 *
 * Everything is derived from the monorepo root (not `process.cwd()`), so the
 * result is identical regardless of which directory a process was launched from.
 *
 * Database CLI roles — never conflate them:
 * - **Authoring** (`make:migration`, `make:seeder`) writes TypeScript into
 *   `source*` directories; those files are the committed source of truth.
 * - **Execution** (`migrate`, `rollback`, `db:seed`) loads plain `.js` from
 *   `dist*` directories. The CLI always runs compiled, so production images
 *   never need tsx/TypeScript.
 */
export interface AppPaths {
  /** Monorepo root (contains `pnpm-workspace.yaml`). */
  monorepoRoot: string;
  /** `<root>/storage` — host-mounted runtime data (logs, backups, ...). */
  storageDirectory: string;
  /** `<root>/packages/database`. */
  databasePackageRoot: string;
  /** Where migrations are authored (TypeScript). */
  sourceMigrationsDirectory: string;
  /** Where seeders are authored (TypeScript). */
  sourceSeedsDirectory: string;
  /** Where migrations are executed from (compiled JavaScript). */
  distMigrationsDirectory: string;
  /** Where seeders are executed from (compiled JavaScript). */
  distSeedsDirectory: string;
  /** `.ts` scaffolding templates (source-only, never compiled output). */
  templatesDirectory: string;
}

export function buildPaths(monorepoRoot: string): AppPaths {
  const databasePackageRoot = path.join(monorepoRoot, 'packages', 'database');
  return {
    monorepoRoot,
    storageDirectory: path.join(monorepoRoot, 'storage'),
    databasePackageRoot,
    sourceMigrationsDirectory: path.join(databasePackageRoot, 'src', 'migrations'),
    sourceSeedsDirectory: path.join(databasePackageRoot, 'src', 'seeds'),
    distMigrationsDirectory: path.join(databasePackageRoot, 'dist', 'src', 'migrations'),
    distSeedsDirectory: path.join(databasePackageRoot, 'dist', 'src', 'seeds'),
    templatesDirectory: path.join(databasePackageRoot, 'src', 'lib', 'scripts', 'utils'),
  };
}

export const paths: AppPaths = buildPaths(resolveMonorepoRoot());

export const {
  monorepoRoot,
  storageDirectory,
  databasePackageRoot,
  sourceMigrationsDirectory,
  sourceSeedsDirectory,
  distMigrationsDirectory,
  distSeedsDirectory,
  templatesDirectory,
} = paths;
