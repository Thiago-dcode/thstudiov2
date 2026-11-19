jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {}, stripeWebhookSecret: '' }));

import { BadRequestException } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { consoleLogger } from 'src/common/testing/console-logger';
import { MediaModerationException } from 'src/common/exceptions/media-moderation-exception';
import { UserService } from './users.service';

const USER = { id: 3, public_id: '22222222-2222-4222-8222-222222222222' };
const UPLOAD = '33333333-3333-4333-8333-333333333333';
const REASON = 'SECRETMODERATIONREASON nudity';

const build = (moderation: { is_allowed: boolean; reason?: string }, optimizeFails = false) => {
  const lines: any[] = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
    });
  }
  const helpers = {
    optimizeImage: optimizeFails ? jest.fn().mockRejectedValue(new Error('unsupported')) : jest.fn().mockResolvedValue(Buffer.from('webp')),
    writeAsset: jest.fn(async (_b: Buffer, path: string) => path),
  };
  const service = new UserService(
    {} as never,
    {} as never,
    consoleLogger({ channel: 'users' }) as unknown as LogService,
    {} as never,
    helpers as never,
    {} as never,
    {} as never,
    { moderateContent: jest.fn().mockResolvedValue({ moderation }) } as never,
    {} as never,
    {} as never,
    { read: jest.fn().mockResolvedValue(Buffer.from('raw')) } as never,
    {} as never,
  );
  const store = (kind: 'avatar' | 'banner' = 'avatar') =>
    (service as unknown as { storeProfileImage: (a: unknown) => Promise<string> }).storeProfileImage({
      user: USER,
      uploadId: UPLOAD,
      kind,
      nameParts: ['Paula'],
      targetSizeMb: 0.3,
    });
  return { store, lines };
};

describe('UserService.storeProfileImage logging', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC-27: a moderation-rejected avatar logs warn "Profile image rejected" {kind, reason:moderation} with the subject user', async () => {
    const { store, lines } = build({ is_allowed: false, reason: REASON });
    await expect(store('avatar')).rejects.toBeInstanceOf(MediaModerationException);
    const rejected = lines.filter((l) => l.message === 'Profile image rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0].level).toBe('WARN');
    expect(rejected[0].operation).toBe('profile-image');
    expect(rejected[0].extraInfo).toEqual({ user_id: 3, kind: 'avatar', reason: 'moderation' });
    expect(rejected[0].extraInfo.user_id).toBe(3);
    expect(JSON.stringify(lines)).not.toContain('SECRETMODERATIONREASON');
  });

  it('AC-27: the same line for a banner carries kind banner', async () => {
    const { store, lines } = build({ is_allowed: false });
    await expect(store('banner')).rejects.toThrow();
    expect(lines.find((l) => l.message === 'Profile image rejected').extraInfo).toEqual({ user_id: 3, kind: 'banner', reason: 'moderation' });
  });

  it('AC-27: an undecodable image logs {reason:invalid_image}', async () => {
    const { store, lines } = build({ is_allowed: true }, true);
    await expect(store()).rejects.toBeInstanceOf(BadRequestException);
    expect(lines.find((l) => l.message === 'Profile image rejected').extraInfo).toEqual({ user_id: 3, kind: 'avatar', reason: 'invalid_image' });
  });

  it('AC-27: an allowed image writes no rejection line', async () => {
    const { store, lines } = build({ is_allowed: true });
    await store();
    expect(lines.filter((l) => l.message === 'Profile image rejected')).toHaveLength(0);
  });
});
