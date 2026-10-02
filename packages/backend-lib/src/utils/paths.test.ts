import fs from 'node:fs';
import path from 'node:path';
import { buildPaths, paths, resolveMonorepoRoot } from './paths';

describe('paths', () => {
  it('resolves the monorepo root from any nested directory', () => {
    expect(resolveMonorepoRoot(__dirname)).toBe(paths.monorepoRoot);
    expect(resolveMonorepoRoot(path.join(paths.monorepoRoot, 'apps'))).toBe(
      paths.monorepoRoot,
    );
    expect(fs.existsSync(path.join(paths.monorepoRoot, 'pnpm-workspace.yaml'))).toBe(true);
  });

  it('throws when no monorepo root exists above the directory', () => {
    const { root } = path.parse(__dirname);
    // Only meaningful when the filesystem root is not itself a workspace.
    if (!fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) {
      expect(() => resolveMonorepoRoot(root)).toThrow(/Monorepo root not found/);
    }
  });

  it('points storage at <root>/storage', () => {
    // Runtime data (logs, backups) is created on the host and is not in the repo,
    // so a fresh checkout — including CI — does not have this directory yet.
    expect(paths.storageDirectory).toBe(path.join(paths.monorepoRoot, 'storage'));
  });

  it('resolves the database package and its source directories to existing paths', () => {
    expect(fs.existsSync(path.join(paths.databasePackageRoot, 'package.json'))).toBe(true);
    for (const dir of [
      paths.sourceMigrationsDirectory,
      paths.sourceSeedsDirectory,
      paths.templatesDirectory,
    ]) {
      expect(fs.statSync(dir).isDirectory()).toBe(true);
    }
  });

  it('finds the scaffolding templates', () => {
    expect(fs.existsSync(path.join(paths.templatesDirectory, 'migration_template.ts'))).toBe(true);
    expect(fs.existsSync(path.join(paths.templatesDirectory, 'seed_template.ts'))).toBe(true);
  });

  it('keeps dist directories under the database package dist/src (built output may not exist)', () => {
    expect(paths.distMigrationsDirectory).toBe(
      path.join(paths.databasePackageRoot, 'dist', 'src', 'migrations'),
    );
    expect(paths.distSeedsDirectory).toBe(
      path.join(paths.databasePackageRoot, 'dist', 'src', 'seeds'),
    );
  });

  it('derives every path from the given root', () => {
    const fake = path.join(path.sep, 'repo');
    for (const value of Object.values(buildPaths(fake))) {
      expect(value.startsWith(fake)).toBe(true);
    }
  });
});
