import { s3BackupStorageConfig, s3StorageConfig } from './storage';

describe('s3BackupStorageConfig', () => {
  const original = process.env.BACKUP_BUCKET;
  afterEach(() => {
    if (original === undefined) delete process.env.BACKUP_BUCKET;
    else process.env.BACKUP_BUCKET = original;
  });

  it('refuses to fall back to the media bucket when BACKUP_BUCKET is unset', () => {
    delete process.env.BACKUP_BUCKET;
    expect(() => s3BackupStorageConfig()).toThrow('BACKUP_BUCKET is not set');
  });

  it('uses the private bucket with no CDN url', () => {
    process.env.BACKUP_BUCKET = 'private-backups';
    const cfg = s3BackupStorageConfig();
    expect(cfg.bucket).toBe('private-backups');
    expect(cfg.cdnUrl).toBeUndefined();
    expect(cfg.region).toBe(s3StorageConfig.region);
  });
});
