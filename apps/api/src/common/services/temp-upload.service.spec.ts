import { BadRequestException } from '@nestjs/common';
import type { StorageService } from '@repo/backend-lib/services/storage-service/base';

const privateStorage = {
  getUploadUrl: jest.fn(),
  head: jest.fn(),
  getBuffer: jest.fn(),
  delete: jest.fn(),
  deleteDirectory: jest.fn(),
};

jest.mock('@repo/backend-lib/config/storage', () => ({
  s3PrivateStorageConfig: () => ({ driver: 's3', bucket: 'private-bucket' }),
}));
jest.mock('@repo/backend-lib/services/storage-service/factory', () => ({
  FactoryStorageService: { create: () => privateStorage },
}));
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: async () => '11111111-1111-4111-8111-111111111111',
}));

import { TempUploadService } from './temp-upload.service';

const USER = '22222222-2222-4222-8222-222222222222';
const U1 = '33333333-3333-4333-8333-333333333333';

describe('TempUploadService', () => {
  let service: TempUploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TempUploadService();
  });

  it('signs the upload under the caller’s own uploads/ prefix in the private bucket', async () => {
    privateStorage.getUploadUrl.mockResolvedValue('https://signed');

    await expect(service.createUploadUrl(USER, 1234)).resolves.toEqual({
      upload_url: 'https://signed',
      upload_id: '11111111-1111-4111-8111-111111111111',
      expires_in: 900,
    });
    expect(privateStorage.getUploadUrl).toHaveBeenCalledWith(`uploads/${USER}/11111111-1111-4111-8111-111111111111`, {
      contentLength: 1234,
      expireIn: 900,
    });
  });

  describe('read', () => {
    it('returns the bytes and deletes the upload', async () => {
      const bytes = Buffer.from('img');
      privateStorage.head.mockResolvedValue({ size: 3 });
      privateStorage.getBuffer.mockResolvedValue(bytes);

      await expect(service.read(USER, U1, 10)).resolves.toBe(bytes);
      expect(privateStorage.getBuffer).toHaveBeenCalledWith(`uploads/${USER}/${U1}`);
      expect(privateStorage.delete).toHaveBeenCalledWith(`uploads/${USER}/${U1}`);
    });

    it.each([null, { size: 0 }])('rejects a missing or empty upload (%p)', async (head) => {
      privateStorage.head.mockResolvedValue(head);

      await expect(service.read(USER, U1, 10)).rejects.toBeInstanceOf(BadRequestException);
      expect(privateStorage.getBuffer).not.toHaveBeenCalled();
    });

    it('rejects and deletes an upload over the cap without reading it', async () => {
      privateStorage.head.mockResolvedValue({ size: 11 });

      await expect(service.read(USER, U1, 10)).rejects.toBeInstanceOf(BadRequestException);
      expect(privateStorage.getBuffer).not.toHaveBeenCalled();
      expect(privateStorage.delete).toHaveBeenCalledWith(`uploads/${USER}/${U1}`);
    });
  });

  it('promotes from the private bucket onto the destination key', async () => {
    const destination = { promoteFrom: jest.fn().mockResolvedValue(true) };

    await expect(
      service.promote(USER, U1, destination as unknown as StorageService, 'users/x/media/y.webp'),
    ).resolves.toBe(true);
    expect(destination.promoteFrom).toHaveBeenCalledWith(
      privateStorage,
      `uploads/${USER}/${U1}`,
      'users/x/media/y.webp',
    );
  });

  it.each(['', '../internal', 'not-a-uuid'])('refuses a key segment that is not a uuid (%p)', async (bad) => {
    await expect(service.read(USER, bad, 10)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.deleteUser(bad)).rejects.toBeInstanceOf(BadRequestException);
    expect(privateStorage.head).not.toHaveBeenCalled();
    expect(privateStorage.deleteDirectory).not.toHaveBeenCalled();
  });

  it('deletes every pending upload of a user by its prefix', async () => {
    privateStorage.deleteDirectory.mockResolvedValue(true);

    await service.deleteUser(USER);
    expect(privateStorage.deleteDirectory).toHaveBeenCalledWith(`uploads/${USER}/`);
  });
});
