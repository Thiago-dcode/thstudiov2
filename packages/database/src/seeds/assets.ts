/**
 * Uploads every file under `src/seeds/assets/` (gitignored; local only) to S3 (same env as API `storage.ts`)
 * and inserts matching `assets` rows. Existing rows with the same slug are deleted first (including S3 objects).
 *
 * Title and slug follow the same rules as {@link AssetsService.create}: title defaults to the file basename,
 * slug is generated from the title via {@link generateValidSlug}.
 *
 * CLI:
 *   pnpm dbcli db:seed -n assets
 *
 * Prerequisites: migrations applied; S3 env vars set (`STORAGE_*`).
 *
 * **Runs only in local app env** (`development`, `local`, or `test` — same rule as `media` seed).
 */

import fs from 'node:fs';
import path from 'node:path';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import type { S3StorageConfig } from '@repo/backend-lib/services/storage-service/types';
import { LogService } from '@repo/backend-lib/services/log-service';
import Logger from '@repo/backend-lib/utils/console';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { generateValidSlug } from '@repo/common-lib/utils/generate-valid-slug';
import type { CreateAssetInput } from '@repo/common-lib/types/assets';
import { Query } from '../lib/facades';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

/** Same allowlist as `src/seeds/media.ts`. */
const ALLOWED_APP_ENVS_FOR_ASSETS_SEED = ['development', 'local', 'test'] as const;

const ASSET_THUMB_TARGET_SIZE_BYTES = Math.floor(0.1 * 1024 * 1024);
const ASSET_THUMB_QUALITY = 90;

type ExistingAsset = {
  id: number;
  slug: string;
  url: string;
  thumbnail?: string | null;
};

function assertLocalAppEnvForAssetsSeed(): void {
  const env = getConfigValue('app').env.toLowerCase();
  if (
    !ALLOWED_APP_ENVS_FOR_ASSETS_SEED.includes(
      env as (typeof ALLOWED_APP_ENVS_FOR_ASSETS_SEED)[number],
    )
  ) {
    throw new Error(
      `Assets seed is only allowed in local environments (${ALLOWED_APP_ENVS_FOR_ASSETS_SEED.join(', ')}). Current app env: "${env}".`,
    );
  }
}

function resolveAssetsDir(): string {
  const dir = path.join(process.cwd(), 'src', 'seeds', 'assets');
  if (fs.existsSync(dir)) {
    return dir;
  }
  throw new Error(
    `assets folder not found at ${dir}. Run dbcli from packages/database and add files under src/seeds/assets/ locally (that folder is gitignored).`,
  );
}

function mimeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.avif':
      return 'image/avif';
    case '.pdf':
      return 'application/pdf';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function isImageFile(filePath: string): boolean {
  return IMAGE_EXT.has(path.extname(filePath).toLowerCase());
}

/** Shape expected by compress / S3 services (Multer memory upload). */
function multerLike(buffer: Buffer, originalname: string, mimetype: string) {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
  };
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
      'S3 storage is not configured. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_ACCESS_KEY (see apps/api/src/config/storage.ts).',
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

function allocateSlug(baseSlug: string, usedSlugs: Set<string>): string {
  let candidate = baseSlug;
  let counter = 1;
  while (usedSlugs.has(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
}

async function uploadAssetThumbnail(
  sourceFile: ReturnType<typeof multerLike>,
  thumbnailPath: string,
  compressService: ReturnType<typeof FactoryCompressService.create>,
  storageService: ReturnType<typeof FactoryStorageService.create>,
): Promise<void> {
  const target =
    sourceFile.size > ASSET_THUMB_TARGET_SIZE_BYTES
      ? ASSET_THUMB_TARGET_SIZE_BYTES
      : sourceFile.size;
  const compressed = await compressService.optimizeImageToWebp(
    sourceFile as Parameters<typeof compressService.optimizeImageToWebp>[0],
    target,
    ASSET_THUMB_QUALITY,
  );
  const thumbnailFile = multerLike(
    compressed.buffer,
    compressed.filename,
    'image/webp',
  );
  await storageService.write(
    thumbnailFile as Parameters<typeof storageService.write>[0],
    thumbnailPath,
  );
}

async function seedAssets(): Promise<void> {
  assertLocalAppEnvForAssetsSeed();

  const assetsDir = resolveAssetsDir();
  const fileNames = fs
    .readdirSync(assetsDir)
    .filter((name) => {
      const absolutePath = path.join(assetsDir, name);
      return fs.statSync(absolutePath).isFile() && !name.startsWith('.');
    })
    .sort();

  if (fileNames.length === 0) {
    Logger.warn(`No files found in ${assetsDir}; nothing to seed.`);
    await LogService.flush();
    return;
  }

  const s3Config = buildS3Config();
  const storageService = FactoryStorageService.create(s3Config);
  const compressService = FactoryCompressService.create({ driver: 'sharp' });
  const usedSlugs = new Set<string>();

  let created = 0;
  for (const name of fileNames) {
    const absolutePath = path.join(assetsDir, name);
    const buffer = fs.readFileSync(absolutePath);
    const sourceMime = mimeForPath(absolutePath);
    const sourceFile = multerLike(buffer, name, sourceMime);

    const originalFilename = name;
    const title = path.parse(originalFilename).name;
    const baseSlug = generateValidSlug(title);
    const slug = allocateSlug(baseSlug, usedSlugs);

    await deleteExistingAssetBySlug(slug, storageService);

    const storagePath = `assets/${slug}/${originalFilename}`;

    await storageService.write(
      sourceFile as Parameters<typeof storageService.write>[0],
      storagePath,
    );

    let thumbnailPath: string | null = null;
    if (isImageFile(absolutePath)) {
      thumbnailPath = `assets/${slug}/thumbnail/${originalFilename}`;
      await uploadAssetThumbnail(
        sourceFile,
        thumbnailPath,
        compressService,
        storageService,
      );
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
