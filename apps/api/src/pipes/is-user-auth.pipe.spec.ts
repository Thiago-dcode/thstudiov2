import { UnauthorizedException } from '@nestjs/common';
import type { UserAuth } from '@repo/common-lib/types/auth';
import { RequestService } from 'src/common/services/request.service';
import { IsUserAuthPipe } from './is-user-auth.pipe';

/**
 * This pipe fronts every `:user_id` route in the atelier (metrics, media, notifications,
 * benefits, subscription, contacts, email preferences). A revision that AND-ed the admin role
 * onto the id check shipped to production and 401'd every ARTIST/CLIENT on their *own* data —
 * the atelier rendered empty for them while it kept working for the one ADMIN account, which
 * is why it went unnoticed. The first case below is that regression.
 */
describe('IsUserAuthPipe', () => {
  const pipeFor = (user: Partial<UserAuth> | null) =>
    new IsUserAuthPipe({ user } as unknown as RequestService);

  const artist = { id: 3, role: { id: 4, name: 'ARTIST' } };
  const admin = { id: 2, role: { id: 1, name: 'ADMIN' } };

  it('allows a non-admin to address their own id', async () => {
    await expect(pipeFor(artist).transform(3)).resolves.toBe(3);
  });

  it('allows a non-admin whose id arrives as a string', async () => {
    await expect(pipeFor(artist).transform('3')).resolves.toBe('3');
  });

  it('allows an admin to address another user id', async () => {
    await expect(pipeFor(admin).transform(3)).resolves.toBe(3);
  });

  it('rejects a non-admin addressing another user id', async () => {
    await expect(pipeFor(artist).transform(2)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unauthenticated request without dereferencing the user', async () => {
    await expect(pipeFor(null).transform(3)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a user carrying no role rather than crashing', async () => {
    await expect(
      pipeFor({ id: 3 } as Partial<UserAuth>).transform(2),
    ).rejects.toThrow(UnauthorizedException);
  });
});
