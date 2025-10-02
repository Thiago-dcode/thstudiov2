import { config } from '@repo/backend-lib/config';
import { StorageConfig } from '@repo/backend-lib/services/storage-service/types';

export const s3StorageConfig: StorageConfig = {
  driver: 's3',
  bucket: config().storage.bucket,
  region: config().storage.region,
  accessKeyId: config().storage.accessKeyId,
  secretAccessKey: config().storage.secretAccessKey,
  signedUrlExpiration: config().storage.signedUrlExpiration,
};

export const fileStorageConfig: StorageConfig = {
  driver: 'file',
  folder: config().storage.folder || 'uploads',
};
