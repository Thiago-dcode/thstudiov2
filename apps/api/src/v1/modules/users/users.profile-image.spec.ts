// `users.service` builds a Stripe client at import time; CI has no key to build it with.
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import { BadRequestException } from '@nestjs/common';
import { MediaModerationException } from 'src/common/exceptions/media-moderation-exception';
import { UserService } from './users.service';

const USER = { id: 3, public_id: '22222222-2222-4222-8222-222222222222' };
const UPLOAD = '33333333-3333-4333-8333-333333333333';

const build = (moderation: { is_allowed: boolean; reason?: string }) => {
  const optimized = Buffer.from('webp-bytes');
  const helpers = {
    optimizeImage: jest.fn().mockResolvedValue(optimized),
    writeAsset: jest.fn(async (_buffer: Buffer, path: string) => path),
  };
  const aiService = { moderateContent: jest.fn().mockResolvedValue({ moderation }) };
  const tempUploads = { read: jest.fn().mockResolvedValue(Buffer.from('raw')) };
  const service = new UserService(
    {} as never, // userRepository
    {} as never, // eventEmitter
    {} as never, // logService
    {} as never, // mailService
    helpers as never,
    {} as never, // requestService
    {} as never, // notifyNewUserMail
    aiService as never,
    {} as never, // profileStatusService
    {} as never, // userSessionsService
    tempUploads as never,
  );
  const store = () =>
    (service as unknown as {
      storeProfileImage: (args: unknown) => Promise<string>;
    }).storeProfileImage({ user: USER, uploadId: UPLOAD, kind: 'avatar', nameParts: ['Paula'], targetSizeMb: 0.3 });
  return { store, helpers, aiService, optimized };
};

describe('UserService.storeProfileImage', () => {
  it('moderates the re-encoded bytes inline, then stores them', async () => {
    const { store, helpers, aiService, optimized } = build({ is_allowed: true });

    const path = await store();

    expect(aiService.moderateContent).toHaveBeenCalledWith(
      `data:image/webp;base64,${optimized.toString('base64')}`,
      { user_id: USER.id },
    );
    expect(helpers.writeAsset).toHaveBeenCalledWith(optimized, path);
    expect(path).toMatch(new RegExp(`^users/${USER.public_id}/.+avatar.+\.webp$`));
  });

  it('stores nothing when moderation rejects the image', async () => {
    const { store, helpers } = build({ is_allowed: false, reason: 'nsfw' });

    await expect(store()).rejects.toBeInstanceOf(MediaModerationException);
    expect(helpers.writeAsset).not.toHaveBeenCalled();
  });

  it('stores nothing when moderation itself fails', async () => {
    const { store, helpers, aiService } = build({ is_allowed: true });
    aiService.moderateContent.mockRejectedValue(new Error('400 Unable to download content'));

    await expect(store()).rejects.toThrow('Unable to download content');
    expect(helpers.writeAsset).not.toHaveBeenCalled();
  });

  it('rejects bytes that do not decode as an image', async () => {
    const { store, helpers, aiService } = build({ is_allowed: true });
    helpers.optimizeImage.mockRejectedValue(new Error('Input buffer contains unsupported image format'));

    await expect(store()).rejects.toBeInstanceOf(BadRequestException);
    expect(aiService.moderateContent).not.toHaveBeenCalled();
  });
});
