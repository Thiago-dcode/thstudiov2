/**
 * Uploads every image under `src/seeds/media-images/` (gitignored; local only) to S3 (same env as API `storage.ts`)
 * and inserts matching `media` rows for the user with username `thsworld` (default admin from `admin-user` seed).
 * No AI moderation, no storage-request events.
 *
 * Config: `getConfigValue('storage')` → S3 driver (see `apps/api/src/config/storage.ts`).
 * Compression: {@link FactoryCompressService} with `driver: 'sharp'` (implementation: `packages/backend-lib/.../sharp-compress.service.ts`).
 *
 * CLI:
 *   pnpm dbcli db:seed -n media
 *
 * Prerequisites: migrations applied; `thsworld` user exists (`pnpm dbcli db:seed -n admin-user`); S3 env vars set (`STORAGE_*`).
 *
 * **Runs only in local app env** (`development`, `local`, or `test` — same rule as `clean-stripe`).
 */

import fs from 'node:fs';
import path from 'node:path';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import type { S3StorageConfig } from '@repo/backend-lib/services/storage-service/types';
import { LogService } from '@repo/backend-lib/services/log-service';
import Logger from '@repo/backend-lib/utils/console';
import {
  DEFAULT_COMPRESSION_LVL,
  TABLES_ENUM,
} from '@repo/common-lib/constants/enums';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { mbToBytes } from '@repo/common-lib/utils/bytes';
import { cleanObj } from '@repo/common-lib/utils/cleanObj';
import type { CreateMediaInput } from '@repo/common-lib/types/media';
import { Query } from '../lib/facades';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** Same default admin username as `admin-user.ts` (`SEED_ADMIN_USERNAME` default). */
const MEDIA_SEED_USERNAME = 'thsworld';

/** Same allowlist as `src/lib/scripts/clean-stripe.ts`. */
const ALLOWED_APP_ENVS_FOR_MEDIA_SEED = ['development', 'local', 'test'] as const;

function assertLocalAppEnvForMediaSeed(): void {
  const env = getConfigValue('app').env.toLowerCase();
  if (
    !ALLOWED_APP_ENVS_FOR_MEDIA_SEED.includes(
      env as (typeof ALLOWED_APP_ENVS_FOR_MEDIA_SEED)[number],
    )
  ) {
    throw new Error(
      `Media seed is only allowed in local environments (${ALLOWED_APP_ENVS_FOR_MEDIA_SEED.join(', ')}). Current app env: "${env}".`,
    );
  }
}

type MediaSeedTargetUser = {
  id: number;
  public_id: string;
  username: string;
};

function resolveMediaImagesDir(): string {
  const dir = path.join(process.cwd(), 'src', 'seeds', 'media-images');
  if (fs.existsSync(dir)) {
    return dir;
  }
  throw new Error(
    `media-images folder not found at ${dir}. Run dbcli from packages/database and add images under src/seeds/media-images/ locally (that folder is gitignored).`,
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
    default:
      return 'application/octet-stream';
  }
}

/** Shape expected by compress / S3 services (Multer memory upload). */
function multerLike(buffer: Buffer, originalname: string, mimetype: string) {
  return {
    fieldname: 'media',
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

async function seedMediaAssetsForUser(user: MediaSeedTargetUser): Promise<void> {
  assertLocalAppEnvForMediaSeed();

  const mediaDir = resolveMediaImagesDir();
  const fileNames = fs
    .readdirSync(mediaDir)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort();

  if (fileNames.length === 0) {
    Logger.warn(`No images found in ${mediaDir}; nothing to seed.`);
    await LogService.flush();
    return;
  }

  const s3Config = buildS3Config();
  const storageService = FactoryStorageService.create(s3Config);
  const compressService = FactoryCompressService.create({ driver: 'sharp' });

  let created = 0;
  for (const name of fileNames) {
    const absolutePath = path.join(mediaDir, name);
    const buffer = fs.readFileSync(absolutePath);
    const sourceMime = mimeForPath(absolutePath);
    const sourceFile = multerLike(buffer, name, sourceMime);

    const mediaPublicId = await generateUUID();
    const baseName = path.parse(name).name;
    const basePath = `users/${user.public_id}/media/${mediaPublicId}/${baseName}`;
    const thumbnailPath = `${basePath}-thumbnail.webp`;

    const thumbnail = await compressService.optimizeImageToWebp(
      sourceFile as Parameters<
        typeof compressService.optimizeImageToWebp
      >[0],
      100 * 1024,
      80,
    );
    const thumbnailFile = multerLike(
      thumbnail.buffer,
      thumbnail.filename,
      'image/webp',
    );
    await storageService.write(
      thumbnailFile as Parameters<typeof storageService.write>[0],
      thumbnailPath,
    );

    const compressionLevel = DEFAULT_COMPRESSION_LVL;
    const targetSize = Math.round(
      Math.min(
        compressService.getSizeCompressed(
          sourceFile.size,
          compressionLevel,
          300 * 1024,
        ),
        mbToBytes(5),
      ),
    );
    const mediaCompressed = await compressService.optimizeImageToWebp(
      sourceFile as Parameters<
        typeof compressService.optimizeImageToWebp
      >[0],
      targetSize,
      100,
    );
    const mediaPath = `${basePath}.webp`;
    const mediaFile = multerLike(
      mediaCompressed.buffer,
      mediaCompressed.filename,
      'image/webp',
    );
    await storageService.write(
      mediaFile as Parameters<typeof storageService.write>[0],
      mediaPath,
    );

    const defaultSeoText = `${user.username} photo`;
    const mediaData: CreateMediaInput = {
      user_id: user.id,
      public_id: mediaPublicId,
      bytes: mediaFile.size,
      thumbnail_bytes: thumbnailFile.size,
      extension: 'webp',
      url: mediaPath,
      thumbnail: thumbnailPath,
      seo_filename: baseName,
      blocked_at: null,
      is_featured: false,
      is_highlight: false,
      shape: await compressService.getImageShape(mediaFile.buffer),
      is_active: true,
      seo_title: defaultSeoText,
      seo_alt: defaultSeoText,
      compression_level: compressionLevel,
    };
    cleanObj(mediaData);

    const columns = Object.keys(mediaData);
    const values = Object.values(mediaData);
    await Query.table(TABLES_ENUM.MEDIA).insert(columns, values);
    created += 1;
  }

  Logger.success(
    `Media seed: ${created} file(s) uploaded to S3 and inserted for user id=${user.id} (${user.username}).`,
  );
  await LogService.flush();
}

export const main = async (username =MEDIA_SEED_USERNAME) => {
  const user = await Query.table(TABLES_ENUM.USERS)
    .where('username', '=', username)
    .first<MediaSeedTargetUser>();

  if (!user) {
    throw new Error(
      `User with username "${username}" not found. Run the admin-user seed first: pnpm dbcli db:seed -n admin-user`,
    );
  }

  await seedMediaAssetsForUser(user);
};
