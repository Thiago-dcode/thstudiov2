import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestService } from 'src/common/services/request.service';
import type { UserExtraDataService } from 'src/v1/modules/user-extra-data/user-extra-data.service';
import { UserStrikesGuard } from './user-strikes.guard';

// `account_strikes` is recounted from `ban_start`, so it is 0 for the whole of a temporary ban.
// The guard used to require it at STRIKES_TO_BAN as well, so temporary bans never applied.
describe('UserStrikesGuard', () => {
  const canActivate = (extraData: { account_strikes: number; ban_lift: Date | null }, method = 'POST') => {
    const guard = new UserStrikesGuard(
      { user: { id: 7 } } as unknown as RequestService,
      { findOneByUserId: jest.fn().mockResolvedValue(extraData) } as unknown as UserExtraDataService,
      new Reflector(),
    );
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ method }) }),
      getHandler: () => () => undefined,
      getClass: () => class {},
    } as unknown as ExecutionContext;
    return guard.canActivate(context);
  };
  const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  it('blocks writes during a ban even after the strikes were recounted to 0', async () => {
    await expect(canActivate({ account_strikes: 0, ban_lift: inDays(4) })).rejects.toThrow();
  });

  it('allows writes once the ban has lifted', async () => {
    await expect(canActivate({ account_strikes: 3, ban_lift: inDays(-1) })).resolves.toBe(true);
  });

  it('never blocks reads', async () => {
    await expect(canActivate({ account_strikes: 0, ban_lift: inDays(4) }, 'GET')).resolves.toBe(true);
  });
});
