import path from 'node:path';
import fs from 'node:fs';

/**
 * Canonical filesystem layout for the database CLI.
 *
 * There are two distinct roles and they must never be conflated:
 *
 * - **Authoring** (`make:migration`, `make:seeder`) writes TypeScript into
 *   `src/migrations` / `src/seeds`. Those files are the source of truth and the
 *   ones that get committed.
 * - **Execution** (`migrate`, `rollback`, `db:seed`) loads plain `.js` from
 *   `dist/src/migrations` / `dist/src/seeds`. The CLI always runs compiled
 *   (`node dist/src/bin/cli.js`), so production images never need tsx/TypeScript.
 *
 * Paths are derived from this file's location rather than `process.cwd()` so the
 * CLI behaves identically no matter which directory it was launched from.
 */
const resolvePackageRoot = (): string => {
  // Compiled: <pkg>/dist/src/lib/scripts/utils — source: <pkg>/src/lib/scripts/utils.
  // Walking up to the nearest package.json covers both without hardcoding depth.
  let directory = __dirname;
  while (!fs.existsSync(path.join(directory, 'package.json'))) {
    const parent = path.dirname(directory);
    if (parent === directory) return process.cwd();
    directory = parent;
  }
  return directory;
};

export const packageRoot = resolvePackageRoot();

/** Where migrations are authored (TypeScript). */
export const sourceMigrationsDirectory = path.join(
  packageRoot,
  'src',
  'migrations',
);

/** Where seeders are authored (TypeScript). */
export const sourceSeedsDirectory = path.join(packageRoot, 'src', 'seeds');

/** Where migrations are executed from (compiled JavaScript). */
export const distMigrationsDirectory = path.join(
  packageRoot,
  'dist',
  'src',
  'migrations',
);

/** Where seeders are executed from (compiled JavaScript). */
export const distSeedsDirectory = path.join(
  packageRoot,
  'dist',
  'src',
  'seeds',
);

/** Directory holding the `.ts` scaffolding templates (source-only, never compiled output). */
export const templatesDirectory = path.join(
  packageRoot,
  'src',
  'lib',
  'scripts',
  'utils',
);
