import { getConfigValue } from '@repo/common-lib/config/utils';
import { S3StorageConfig, StorageConfig } from '../services/storage-service/types';
import { CompressConfig } from '../services/compress-service/types';

const STORAGE_CONFIG = getConfigValue('storage');
export const s3StorageConfig: S3StorageConfig = {
  driver: 's3',
  bucket: STORAGE_CONFIG.bucket!,
  region: STORAGE_CONFIG.region!,
  accessKeyId: STORAGE_CONFIG.accessKeyId!,
  secretAccessKey: STORAGE_CONFIG.secretAccessKey!,
  signedUrlExpiration: STORAGE_CONFIG.signedUrlExpiration,
  cdnUrl: STORAGE_CONFIG.cdnUrl,
};

/**
 * Storage for database dumps: the media bucket's credentials and region, but a separate private bucket with no
 * CDN in front. Throws when BACKUP_BUCKET is unset rather than falling back to the public media bucket.
 */
export const s3BackupStorageConfig = (): S3StorageConfig => {
  const bucket = getConfigValue('backup').bucket;
  if (!bucket) throw new Error('BACKUP_BUCKET is not set; refusing to store database dumps in the media bucket');
  return { ...s3StorageConfig, bucket, cdnUrl: undefined };
};

export const fileStorageConfig: StorageConfig = {
  driver: 'file',
  folder: STORAGE_CONFIG.folder || 'uploads',
};

export const compressConfig: CompressConfig = {
  driver: 'sharp'
}
