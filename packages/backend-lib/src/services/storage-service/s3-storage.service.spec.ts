import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { S3StorageService } from './s3-storage.service';
import type { StorageService } from './storage.service';

const build = () => {
  const storage = new S3StorageService({
    driver: 's3',
    bucket: 'media-bucket',
    region: 'us-east-1',
    accessKeyId: 'x',
    secretAccessKey: 'y',
    signedUrlExpiration: 3600,
  });
  const send = jest.fn().mockResolvedValue({});
  (storage as unknown as { s3Client: { send: jest.Mock } }).s3Client = { send };
  const source = {
    bucket: 'private-bucket',
    delete: jest.fn().mockResolvedValue(true),
  } as unknown as StorageService & { delete: jest.Mock };
  return { storage, send, source };
};

describe('S3StorageService.promoteFrom', () => {
  it('copies from the source bucket with a key-derived type and no tags, then deletes the source', async () => {
    const { storage, send, source } = build();

    await expect(storage.promoteFrom(source, 'uploads/u/1', 'users/u/media/m.webp')).resolves.toBe(true);

    const copy = send.mock.calls[0][0];
    expect(copy).toBeInstanceOf(CopyObjectCommand);
    expect(copy.input).toMatchObject({
      Bucket: 'media-bucket',
      CopySource: 'private-bucket/uploads/u/1',
      Key: 'users/u/media/m.webp',
      MetadataDirective: 'REPLACE',
      ContentType: 'image/webp',
      TaggingDirective: 'REPLACE',
    });
    expect(source.delete).toHaveBeenCalledWith('uploads/u/1');
  });

  it('returns false and keeps the source when the copy fails', async () => {
    const { storage, send, source } = build();
    send.mockRejectedValueOnce(new Error('AccessDenied'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(storage.promoteFrom(source, 'uploads/u/1', 'users/u/media/m.webp')).resolves.toBe(false);
    expect(source.delete).not.toHaveBeenCalled();
  });

  it('still succeeds when only the source delete fails', async () => {
    const { storage, source } = build();
    source.delete.mockResolvedValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(storage.promoteFrom(source, 'uploads/u/1', 'users/u/media/m.webp')).resolves.toBe(true);
  });
});

describe('S3StorageService.move', () => {
  it('copies within its own bucket, then deletes the old key', async () => {
    const { storage, send } = build();

    await expect(storage.move('a/old.webp', 'a/new.webp')).resolves.toBe(true);

    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: 'media-bucket',
      CopySource: 'media-bucket/a/old.webp',
      Key: 'a/new.webp',
    });
    const del = send.mock.calls[1][0];
    expect(del).toBeInstanceOf(DeleteObjectCommand);
    expect(del.input).toEqual({ Bucket: 'media-bucket', Key: 'a/old.webp' });
  });
});
