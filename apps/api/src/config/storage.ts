import { getConfigValue } from '@repo/common-lib/config/utils';
import { StorageConfig } from '@repo/backend-lib/services/storage-service/types';

const STORAGE_CONFIG = getConfigValue('storage');
export const s3StorageConfig: StorageConfig = {
  driver: 's3',
  bucket: STORAGE_CONFIG.bucket,
  region: STORAGE_CONFIG.region,
  accessKeyId: STORAGE_CONFIG.accessKeyId,
  secretAccessKey: STORAGE_CONFIG.secretAccessKey,
  signedUrlExpiration: STORAGE_CONFIG.signedUrlExpiration,
};

export const fileStorageConfig: StorageConfig = {
  driver: 'file',
  folder: STORAGE_CONFIG.folder || 'uploads',
};
