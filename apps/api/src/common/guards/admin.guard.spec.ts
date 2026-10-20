const raw = jest.fn();
jest.mock('@repo/database/facades', () => ({ Query: { raw } }));

import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { RequestService } from 'src/common/services/request.service';

const guardFor = (roleName: string | null) =>
  new AdminGuard({
    user: roleName ? { id: 1, role: { id: 1, name: roleName } } : null,
  } as unknown as RequestService);

describe('AdminGuard', () => {
  beforeEach(() => raw.mockReset());

  it('lets an admin through when the database agrees', async () => {
    raw.mockResolvedValue({ rows: [{ name: 'ADMIN' }] });
    await expect(guardFor('ADMIN').canActivate()).resolves.toBe(true);
  });

  it('refuses a token that still says ADMIN after the role was taken away', async () => {
    raw.mockResolvedValue({ rows: [{ name: 'USER' }] });
    await expect(guardFor('ADMIN').canActivate()).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a banned admin (no row matches)', async () => {
    raw.mockResolvedValue({ rows: [] });
    await expect(guardFor('ADMIN').canActivate()).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a non-admin token without querying', async () => {
    await expect(guardFor('USER').canActivate()).rejects.toBeInstanceOf(ForbiddenException);
    expect(raw).not.toHaveBeenCalled();
  });
});
