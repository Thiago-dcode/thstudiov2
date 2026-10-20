jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
  stripeWebhookSecret: '',
}));
// The real helper dynamic-imports `uuid`, which Jest can't run without VM modules.
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'public-uuid'),
}));

import { hash } from '@repo/common-lib/utils/hash';
import { UserService } from './users.service';

// A password change or ban is how an account owner (or moderation) evicts whoever else
// holds a session; sessions issued before it must stop working.
describe('UserService — session revocation', () => {
  const userRepository = {
    findOneByWithSecrets: jest.fn(),
    updateById: jest.fn(),
  };
  const userSessionsService = { expireAllForUser: jest.fn() };
  const requestService: { user: unknown } = { user: null };

  let service: UserService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hash('old-password');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.updateById.mockImplementation(async (id, data) => ({ id, ...data }));
    userSessionsService.expireAllForUser.mockResolvedValue(undefined);
    service = new UserService(
      userRepository as never,
      {} as never, // eventEmitter
      {} as never, // logService
      {} as never, // mailService
      {} as never, // helpers
      requestService as never,
      {} as never, // notifyNewUserMail
      {} as never, // aiService
      {} as never, // profileStatusService
      {} as never, // plansService
      userSessionsService as never,
    );
  });

  it('ends every other session after a password change, keeping the caller’s own', async () => {
    requestService.user = { id: 7, token: 'current-token' };
    userRepository.findOneByWithSecrets.mockResolvedValue({
      id: 7,
      password: passwordHash,
      password_reset_count: 0,
      next_password_reset: null,
    });

    await service.updatePassword(7, { old_password: 'old-password', new_password: 'new-password' } as never);

    expect(userSessionsService.expireAllForUser).toHaveBeenCalledWith(7, 'current-token');
  });

  it('ends every session of a banned user', async () => {
    await service.banUser(9, 'policy');

    expect(userSessionsService.expireAllForUser).toHaveBeenCalledWith(9);
  });
});
