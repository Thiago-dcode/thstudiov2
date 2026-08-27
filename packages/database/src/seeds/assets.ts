/**
 * Uploads every file under `src/seeds/assets/` (gitignored; local only) to S3 (same env as API `storage.ts`)
 * and inserts matching `assets` rows. Existing rows with the same slug are deleted first (including S3 objects).
 *
 * Title and slug follow the same rules as {@link AssetsService.create}: title defaults to the file basename,
 * slug is generated from the title via {@link generateValidSlug}.
 *
 * Optional paired thumbnails: for `Hero drone video.mp4`, place `Hero drone video_thumbnail.jpg`
 * (or `.png` / `.webp`) alongside it.
 *
 * CLI:
 *   pnpm dbcli db:seed -n assets
 *
 * Prerequisites: migrations applied; S3 env vars set (`STORAGE_*`).
 */

import fs from 'node:fs';
import path from 'node:path';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import type { S3StorageConfig } from '@repo/backend-lib/services/storage-service/types';
import { LogService } from '@repo/backend-lib/services/log-service';
import Logger from '@repo/backend-lib/utils/console';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { generateValidSlug } from '@repo/common-lib/utils/generate-valid-slug';
import type { CreateAssetInput } from '@repo/common-lib/types/assets';
import { Query } from '../lib/facades';

type ExistingAsset = {
  id: number;
  slug: string;
  url: string;
  thumbnail?: string | null;
};

type AssetSeedEntry = {
  asset: string;
  thumbnail: string | null;
};

function resolveAssetsDir(): string {
  const dir = path.join(process.cwd(), 'src', 'seeds', 'assets');
  if (fs.existsSync(dir)) {
    return dir;
  }
  throw new Error(
    `assets folder not found at ${dir}. Run dbcli from packages/database and add files under src/seeds/assets/ locally (that folder is gitignored).`,
  );
}

function buildS3Config(): S3StorageConfig {
  const STORAGE_CONFIG = getConfigValue('storage');
  if (
    !STORAGE_CONFIG.bucket ||
    !STORAGE_CONFIG.region ||
    !STORAGE_CONFIG.accessKeyId ||
    !STORAGE_CONFIG.secretAccessKey
  ) {
    throw new Error(
      'S3 storage is not configured. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_ACCESS_KEY (see packages/backend-lib/src/config/storage.ts).',
    );
  }
  return {
    driver: 's3',
    bucket: STORAGE_CONFIG.bucket,
    region: STORAGE_CONFIG.region,
    accessKeyId: STORAGE_CONFIG.accessKeyId,
    secretAccessKey: STORAGE_CONFIG.secretAccessKey,
    signedUrlExpiration: STORAGE_CONFIG.signedUrlExpiration,
  };
}

function readFileForUpload(
  filePath: string,
  originalname: string,
): Parameters<ReturnType<typeof FactoryStorageService.create>['write']>[0] {
  const buffer = fs.readFileSync(filePath);
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
  };
}

async function deleteExistingAssetBySlug(
  slug: string,
  storageService: ReturnType<typeof FactoryStorageService.create>,
): Promise<void> {
  const existing = await Query.table(TABLES_ENUM.ASSETS)
    .where('slug', '=', slug)
    .first<ExistingAsset>();

  if (!existing) return;

  await storageService.deleteDirectory(`assets/${existing.slug}/`);
  await Query.table(TABLES_ENUM.ASSETS).where('slug', '=', slug).delete();
}

const THUMBNAIL_EXTENSIONS = new Set(['.jpg', '.png', '.webp']);

function assetBaseName(assetName: string): string {
  const ext = path.extname(assetName);
  return path.basename(assetName, ext);
}

function findPairedThumbnailName(assetName: string, assetsDir: string): string | null {
  const base = assetBaseName(assetName);

  for (const ext of THUMBNAIL_EXTENSIONS) {
    const candidate = `${base}_thumbnail${ext}`;
    if (fs.existsSync(path.join(assetsDir, candidate))) {
      return candidate;
    }
  }

  return null;
}

function buildAssetEntries(assetsDir: string): AssetSeedEntry[] {
  const allFileNames = fs
    .readdirSync(assetsDir)
    .filter((name) => {
      const absolutePath = path.join(assetsDir, name);
      return fs.statSync(absolutePath).isFile() && !name.startsWith('.');
    })
    .sort();

  const thumbnailFileNames = new Set(
    allFileNames.filter((name) => {
      const ext = path.extname(name).toLowerCase();
      const base = assetBaseName(name);
      return base.endsWith('_thumbnail') && THUMBNAIL_EXTENSIONS.has(ext);
    }),
  );

  return allFileNames
    .filter((name) => !thumbnailFileNames.has(name))
    .map((name) => ({
      asset: name,
      thumbnail: findPairedThumbnailName(name, assetsDir),
    }));
}

async function seedAssets(): Promise<void> {
  const assetsDir = resolveAssetsDir();
  const entries = buildAssetEntries(assetsDir);

  if (entries.length === 0) {
    Logger.warn(`No files found in ${assetsDir}; nothing to seed.`);
    await LogService.flush();
    return;
  }

  const storageService = FactoryStorageService.create(buildS3Config());

  let created = 0;
  for (const entry of entries) {
    const originalFilename = entry.asset;
    const title = path.parse(originalFilename).name;
    const slug = generateValidSlug(title);

    await deleteExistingAssetBySlug(slug, storageService);

    const storagePath = `assets/${slug}`;
    const assetFile = readFileForUpload(path.join(assetsDir, originalFilename), originalFilename);
    await storageService.write(assetFile, storagePath);

    let thumbnailPath: string | null = null;
    if (entry.thumbnail) {
      thumbnailPath = `assets/${slug}-thumbnail`;
      const thumbnailFile = readFileForUpload(
        path.join(assetsDir, entry.thumbnail),
        entry.thumbnail,
      );
      await storageService.write(thumbnailFile, thumbnailPath);
    }

    const assetData: CreateAssetInput = {
      url: storagePath,
      thumbnail: thumbnailPath,
      slug,
      title,
      description: null,
      filename: originalFilename,
    };

    const columns = Object.keys(assetData);
    const values = Object.values(assetData);
    await Query.table(TABLES_ENUM.ASSETS).insert(columns, values);
    created += 1;
  }

  Logger.success(`Assets seed: ${created} file(s) uploaded to S3 and inserted.`);
  await LogService.flush();
}

export const main = async () => {
  await seedAssets();
};
