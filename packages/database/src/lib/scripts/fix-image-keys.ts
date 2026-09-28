import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import Logger from '@repo/backend-lib/utils/console';
import { killClient } from '../client';
import { Query } from '../facades';
import { buildS3Config } from './clean-s3';
import { connectDb } from './utils';

/**
 * One-off backfill for image keys stored before 2026-09-27:
 *
 * - `users.avatar` / `users.banner` saved WITHOUT an extension (`users/{id}/avatar`,
 *   `users/{id}/banner-3f9a1c04`). S3 derives Content-Type from the extension, so they were served
 *   as `application/octet-stream` — which Google Images and link-preview scrapers reject.
 * - `about_page.photo` saved under `users/[object Object]/about_page/…` (a `getPublicId` bug) —
 *   one prefix shared by every user — and also without an extension.
 *
 * Each object is COPIED to a correct key (`….webp` under the owner's own `users/{public_id}/`
 * prefix; the bytes were always WebP) and the row is updated. The old object is left in place so
 * API responses cached with the old path keep working until they expire; run again with
 * `--delete-old` a day later to remove the originals.
 *
 * Dry run by default: prints the plan and changes nothing until `--apply`.
 */

type Plan = {
  table: 'users' | 'about_page';
  column: 'avatar' | 'banner' | 'photo';
  id: number;
  from: string;
  to: string;
};

const NO_EXTENSION = `!~ '\\.[A-Za-z0-9]+$'`;

const lastSegment = (key: string) => key.slice(key.lastIndexOf('/') + 1);

async function buildPlan(): Promise<Plan[]> {
  const plan: Plan[] = [];

  for (const column of ['avatar', 'banner'] as const) {
    const rows = (await Query.raw(
      `SELECT id, ${column} AS path FROM users WHERE ${column} IS NOT NULL AND ${column} <> '' AND ${column} ${NO_EXTENSION}`,
    )) as unknown;
    for (const row of extractRows<{ id: number; path: string }>(rows)) {
      plan.push({ table: 'users', column, id: row.id, from: row.path, to: `${row.path}.webp` });
    }
  }

  const photos = (await Query.raw(
    `SELECT ap.id, ap.photo AS path, u.public_id
       FROM about_page ap
       JOIN users u ON u.id = ap.user_id
      WHERE ap.photo IS NOT NULL AND ap.photo <> ''
        AND (ap.photo LIKE 'users/[object Object]/%' OR ap.photo ${NO_EXTENSION})`,
  )) as unknown;
  for (const row of extractRows<{ id: number; path: string; public_id: string }>(photos)) {
    const name = lastSegment(row.path).replace(/\.[A-Za-z0-9]+$/, '');
    plan.push({
      table: 'about_page',
      column: 'photo',
      id: row.id,
      from: row.path,
      to: `users/${row.public_id}/about_page/${name}.webp`,
    });
  }
  return plan;
}

function extractRows<T>(result: unknown): T[] {
  const r = result as { rows?: T[] } | T[][] | undefined;
  const rows = Array.isArray(r) ? r[0] : r?.rows ?? [];
  return Array.isArray(rows) ? rows : [];
}

export type FixImageKeysOptions = { apply: boolean; deleteOld: boolean };

const fixImageKeys = async ({ apply, deleteOld }: FixImageKeysOptions) => {
  const start = Date.now();
  try {
    await connectDb();
    const storage = FactoryStorageService.create(buildS3Config());

    if (deleteOld) {
      await removeOriginals(storage, apply);
      process.exit(0);
    }

    const plan = await buildPlan();
    Logger.info(`Found ${plan.length} image key(s) to fix${apply ? '' : ' (dry run: pass --apply to write)'}.`);

    let fixed = 0;
    let missing = 0;
    let failed = 0;
    for (const item of plan) {
      Logger.info(`  ${item.table}.${item.column} #${item.id}: ${item.from} → ${item.to}`);
      if (!apply) continue;
      try {
        if (!(await storage.exists(item.from))) {
          Logger.warn('    source object missing, skipped');
          missing++;
          continue;
        }
        // Copy (read + write), not move: `write` derives Content-Type from the new `.webp` key, and
        // the original stays until `--delete-old` so cached responses never point at nothing.
        const bytes = await storage.getBuffer(item.from);
        await storage.write(bytes, item.to);
        await Query.table(item.table).where('id', '=', item.id).update([item.column], [item.to]);
        fixed++;
      } catch (error) {
        Logger.error(`    failed: ${error instanceof Error ? error.message : String(error)}`);
        failed++;
      }
    }

    if (apply) {
      Logger.success(
        `✅ Fixed ${fixed}, missing ${missing}, failed ${failed} in ${((Date.now() - start) / 1000).toFixed(1)}s. ` +
          'Run again with --delete-old tomorrow to remove the originals.',
      );
    }
    process.exit(failed ? 1 : 0);
  } catch (error) {
    Logger.error('❌ fix:image-keys failed:', error);
    process.exit(1);
  } finally {
    await killClient();
  }
};

/**
 * Deletes the pre-fix originals once every row points at its new key:
 * - avatar/banner: the fix appended `.webp`, so the original is the current key minus `.webp`;
 * - about photos: everything under the shared `users/[object Object]/` prefix.
 */
async function removeOriginals(
  storage: ReturnType<typeof FactoryStorageService.create>,
  apply: boolean,
) {
  const stillReferenced = (await buildPlan()).length;
  if (stillReferenced) {
    Logger.error(`❌ ${stillReferenced} row(s) still point at old keys — run with --apply first.`);
    process.exit(1);
  }
  const suffix = apply ? '' : ' (dry run: pass --apply to delete)';

  let deleted = 0;
  for (const column of ['avatar', 'banner'] as const) {
    const rows = (await Query.raw(
      `SELECT ${column} AS path FROM users WHERE ${column} LIKE '%.webp'`,
    )) as unknown;
    for (const { path } of extractRows<{ path: string }>(rows)) {
      const original = path.slice(0, -'.webp'.length);
      if (!(await storage.exists(original))) continue;
      Logger.info(`  delete ${original}${suffix}`);
      if (apply) {
        await storage.delete(original);
        deleted++;
      }
    }
  }

  Logger.info(`  delete prefix users/[object Object]/${suffix}`);
  if (apply) await storage.deleteDirectory('users/[object Object]/');
  if (apply) Logger.success(`✅ Deleted ${deleted} avatar/banner original(s) and the shared about-page prefix.`);
}

export { fixImageKeys };
