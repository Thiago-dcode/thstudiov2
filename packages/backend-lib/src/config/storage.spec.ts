import { s3PrivateStorageConfig, s3StorageConfig } from './storage';

describe('s3PrivateStorageConfig', () => {
  const original = process.env.PRIVATE_BUCKET;
  afterEach(() => {
    if (original === undefined) delete process.env.PRIVATE_BUCKET;
    else process.env.PRIVATE_BUCKET = original;
  });

  it('refuses to fall back to the media bucket when PRIVATE_BUCKET is unset', () => {
    // Empty, not deleted: `config()` re-reads the repo `.env` on every call, and dotenv only
    // fills variables that are missing — a deleted one would come straight back from it.
    process.env.PRIVATE_BUCKET = '';
    expect(() => s3PrivateStorageConfig()).toThrow('PRIVATE_BUCKET is not set');
  });

  it('uses the private bucket with no CDN url', () => {
    process.env.PRIVATE_BUCKET = 'private-bucket';
    const cfg = s3PrivateStorageConfig();
    expect(cfg.bucket).toBe('private-bucket');
    expect(cfg.cdnUrl).toBeUndefined();
    expect(cfg.region).toBe(s3StorageConfig.region);
  });
});
