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

export const fileStorageConfig: StorageConfig = {
  driver: 'file',
  folder: STORAGE_CONFIG.folder || 'uploads',
};

export const compressConfig: CompressConfig = {
  driver: 'sharp'
}
