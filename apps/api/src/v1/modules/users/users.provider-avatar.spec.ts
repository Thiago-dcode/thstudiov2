// `users.service` builds a Stripe client at import time; CI has no key to build it with.
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import { UPDATE_PROFILE_STATUS_EVENT } from '@repo/common-lib/constants/events';
import { MAX_IMAGE_UPLOAD_BYTES } from '@repo/common-lib/constants/limits';
import { UserService } from './users.service';

const USER = { id: 3, public_id: '22222222-2222-4222-8222-222222222222' };
const URL_ = 'https://lh3.googleusercontent.com/a/abc=s512-c';

const imageResponse = (body: Uint8Array, headers: Record<string, string> = {}) =>
  new Response(body, { status: 200, headers: { 'content-type': 'image/jpeg', ...headers } });

const build = ({ currentAvatar = null as string | null, setResult = true, moderation = { is_allowed: true } } = {}) => {
  const optimized = Buffer.from('webp-bytes');
  const userRepository = {
    getAvatar: jest.fn().mockResolvedValue(currentAvatar),
    setAvatarIfEmpty: jest.fn().mockResolvedValue(setResult),
  };
  const eventEmitter = { emit: jest.fn() };
  const logService = { info: jest.fn(), success: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
  const helpers = {
    optimizeImage: jest.fn().mockResolvedValue(optimized),
    writeAsset: jest.fn(async (_buffer: Buffer, path: string) => path),
    deleteAsset: jest.fn().mockResolvedValue(undefined),
  };
  const aiService = { moderateContent: jest.fn().mockResolvedValue({ moderation }) };
  const service = new UserService(
    userRepository as never,
    eventEmitter as never,
    {} as never, // mailService
    helpers as never,
    { log: () => logService, traceCarrier: () => ({ service: 'api' }) } as never, // requestService
    {} as never, // notifyNewUserMail
    aiService as never,
    {} as never, // profileStatusService
    {} as never, // userSessionsService
    {} as never, // tempUploads
    {} as never, // usernameHistoryRepository
    {} as never, // storageService
  );
  const run = () =>
    service.importProviderAvatar({ user: USER, url: URL_, provider: 'google', nameParts: ['Ana', 'Lima'] });
  return { run, userRepository, eventEmitter, logService, helpers, aiService };
};

describe('UserService.importProviderAvatar', () => {
  const fetchMock = jest.fn();
  const realFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as never;
  });
  afterAll(() => {
    global.fetch = realFetch;
  });

  it('downloads without following redirects, moderates, stores and sets the avatar', async () => {
    fetchMock.mockResolvedValue(imageResponse(new Uint8Array([1, 2, 3])));
    const { run, userRepository, eventEmitter, helpers, aiService, logService } = build();

    await run();

    expect(fetchMock).toHaveBeenCalledWith(URL_, expect.objectContaining({ redirect: 'error' }));
    expect(aiService.moderateContent).toHaveBeenCalled();
    const path = helpers.writeAsset.mock.calls[0][1];
    expect(path).toMatch(new RegExp(`^users/${USER.public_id}/.+avatar.+\\.webp$`));
    expect(userRepository.setAvatarIfEmpty).toHaveBeenCalledWith(USER.id, path);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      UPDATE_PROFILE_STATUS_EVENT,
      expect.objectContaining({ userId: USER.id, fields: { has_avatar_field: true } }),
    );
    expect(logService.success).toHaveBeenCalledWith('Provider avatar imported', { user_id: 3, provider: 'google', operation: 'profile-image' });
  });

  it('does nothing when the user already has an avatar', async () => {
    const { run, helpers } = build({ currentAvatar: 'users/x/avatar.webp' });

    await run();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(helpers.writeAsset).not.toHaveBeenCalled();
  });

  it('removes its stored copy when an avatar was set while it ran', async () => {
    fetchMock.mockResolvedValue(imageResponse(new Uint8Array([1])));
    const { run, helpers, eventEmitter } = build({ setResult: false });

    await run();

    expect(helpers.deleteAsset).toHaveBeenCalledWith(helpers.writeAsset.mock.calls[0][1]);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('stops reading a body larger than the upload limit, without throwing', async () => {
    fetchMock.mockResolvedValue(imageResponse(new Uint8Array(MAX_IMAGE_UPLOAD_BYTES + 1)));
    const { run, helpers, logService } = build();

    await expect(run()).resolves.toBeUndefined();
    expect(helpers.optimizeImage).not.toHaveBeenCalled();
    expect(logService.error).toHaveBeenCalledWith(
      'Provider avatar import failed',
      expect.objectContaining({ error_message: 'Avatar download too large', operation: 'profile-image' }),
    );
    expect(logService.critical).not.toHaveBeenCalled();
  });

  it('refuses a declared Content-Length over the limit before reading the body', async () => {
    const body = new Uint8Array([1]);
    fetchMock.mockResolvedValue(imageResponse(body, { 'content-length': String(MAX_IMAGE_UPLOAD_BYTES + 1) }));
    const { run, helpers } = build();
    const getReader = jest.spyOn(ReadableStream.prototype, 'getReader');

    await run();

    expect(getReader).not.toHaveBeenCalled();
    expect(helpers.optimizeImage).not.toHaveBeenCalled();
    getReader.mockRestore();
  });

  it('does not store an error response', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 404, headers: { 'content-type': 'image/jpeg' } }));
    const { run, helpers, logService } = build();

    await run();

    expect(helpers.optimizeImage).not.toHaveBeenCalled();
    expect(logService.error).toHaveBeenCalledWith(
      'Provider avatar import failed',
      expect.objectContaining({ error_message: 'Avatar download answered 404' }),
    );
  });

  it('rejects a response that is not an image', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } }));
    const { run, helpers } = build();

    await run();

    expect(helpers.optimizeImage).not.toHaveBeenCalled();
  });

  it('stores nothing when moderation rejects the picture, and logs no error', async () => {
    fetchMock.mockResolvedValue(imageResponse(new Uint8Array([1])));
    const { run, helpers, logService, userRepository } = build({ moderation: { is_allowed: false, reason: 'nsfw' } as never });

    await expect(run()).resolves.toBeUndefined();
    expect(helpers.writeAsset).not.toHaveBeenCalled();
    expect(userRepository.setAvatarIfEmpty).not.toHaveBeenCalled();
    expect(logService.warn).toHaveBeenCalledWith('Profile image rejected', expect.objectContaining({ reason: 'moderation' }));
    expect(logService.error).not.toHaveBeenCalled();
  });

  it('never throws when the download fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const { run, logService } = build();

    await expect(run()).resolves.toBeUndefined();
    expect(logService.error).toHaveBeenCalled();
  });
});
