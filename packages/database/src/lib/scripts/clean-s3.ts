import { getConfigValue } from '@repo/common-lib/config/utils';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import type { S3StorageConfig } from '@repo/backend-lib/services/storage-service/types';
import Logger from '@repo/backend-lib/utils/console';
import {
  DESTRUCTIVE_PASSWORD_ENV,
  verifyDestructivePassword,
} from './utils/destructive-password';

const assertDestructivePassword = (password: string, shouldExit: boolean) => {
  if (!verifyDestructivePassword(password)) {
    Logger.error(
      `❌ Invalid password (check ${DESTRUCTIVE_PASSWORD_ENV}). Refusing S3 cleanup.`,
    );
    if (shouldExit) process.exit(1);
    throw new Error('Invalid destructive-action password');
  }
};

const buildS3Config = (): S3StorageConfig => {
  const STORAGE_CONFIG = getConfigValue('storage');
  if (
    !STORAGE_CONFIG.bucket ||
    !STORAGE_CONFIG.region ||
    !STORAGE_CONFIG.accessKeyId ||
    !STORAGE_CONFIG.secretAccessKey
  ) {
    throw new Error(
      'S3 storage is not configured. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_ACCESS_KEY.',
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
};

export type CleanS3Options = { exitProcess?: boolean; password: string };

const cleanS3 = async (options: CleanS3Options) => {
  const shouldExit = options.exitProcess !== false;
  const start = Date.now();
  try {
    assertDestructivePassword(options.password, shouldExit);

    const s3Config = buildS3Config();
    const storageService = FactoryStorageService.create(s3Config);

    Logger.info(`🔄 Emptying S3 bucket "${s3Config.bucket}"...`);
    const success = await storageService.deleteDirectory('');

    if (!success) {
      throw new Error('deleteDirectory returned false — check S3 permissions or connectivity.');
    }

    Logger.success(
      `✅ S3 cleanup completed in ${((Date.now() - start) / 1000).toFixed(2)}s`,
    );
    if (shouldExit) process.exit(0);
  } catch (error) {
    Logger.error('❌ S3 cleanup failed:', error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};

export { cleanS3 };
