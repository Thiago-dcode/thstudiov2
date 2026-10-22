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
 * The private bucket: the media bucket's credentials and region, but no CDN in front. Holds database dumps
 * (`internal/backups/`) and presigned uploads that have not been claimed yet (`uploads/`). Throws when
 * PRIVATE_BUCKET is unset rather than falling back to the public media bucket.
 */
export const s3PrivateStorageConfig = (): S3StorageConfig => {
  const bucket = getConfigValue('storage').privateBucket;
  if (!bucket) throw new Error('PRIVATE_BUCKET is not set; refusing to fall back to the public media bucket');
  return { ...s3StorageConfig, bucket, cdnUrl: undefined };
};

export const fileStorageConfig: StorageConfig = {
  driver: 'file',
  folder: STORAGE_CONFIG.folder || 'uploads',
};

export const compressConfig: CompressConfig = {
  driver: 'sharp'
}
