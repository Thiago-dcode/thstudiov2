import type { UserAuth } from '@repo/common-lib/types/auth';
import { PublicViewerService } from './public-viewer.service';
import { RequestService } from './request.service';
import { AuthHelper } from 'src/v1/modules/auth/auth-helper.service';

const owner = { id: 7, role: { id: 2, name: 'USER' } } as unknown as UserAuth;
const admin = { id: 1, role: { id: 1, name: 'ADMIN' } } as unknown as UserAuth;

const build = (opts: { token?: string | null; user?: UserAuth | null; resolve?: jest.Mock }) => {
  const store: { user: UserAuth | null; bearer_token: string | null; viewer?: UserAuth | null } = {
    user: opts.user ?? null,
    bearer_token: opts.token ?? null,
  };
  const requestService = {
    get user() { return store.user; },
    get bearer_token() { return store.bearer_token; },
    get viewer() { return store.viewer; },
    set viewer(v: UserAuth | null) { store.viewer = v; },
  } as unknown as RequestService;
  const resolve = opts.resolve ?? jest.fn();
  const service = new PublicViewerService({ resolveUserAuth: resolve } as unknown as AuthHelper, requestService);
  return { service, resolve };
};

describe('PublicViewerService', () => {
  it('treats an anonymous caller as a visitor without resolving anything', async () => {
    const { service, resolve } = build({});
    await expect(service.canSeeHidden(7)).resolves.toBe(false);
    expect(resolve).not.toHaveBeenCalled();
  });

  it('lets the owner see hidden entities, and resolves the token once per request', async () => {
    const resolve = jest.fn().mockResolvedValue(owner);
    const { service } = build({ token: 't', resolve });
    await expect(service.canSeeHidden(7)).resolves.toBe(true);
    await expect(service.canSeeHidden(8)).resolves.toBe(false);
    await expect(service.canSeeHidden(undefined)).resolves.toBe(false);
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('lets an admin see any hidden entity, including cross-artist lists', async () => {
    const { service } = build({ token: 't', resolve: jest.fn().mockResolvedValue(admin) });
    await expect(service.canSeeHidden(8)).resolves.toBe(true);
    await expect(service.canSeeHidden(undefined)).resolves.toBe(true);
  });

  it('treats an invalid or expired token as a visitor', async () => {
    const { service } = build({ token: 't', resolve: jest.fn().mockRejectedValue(new Error('expired')) });
    await expect(service.canSeeHidden(7)).resolves.toBe(false);
  });

  it('reuses the user AuthGuard already resolved on protected routes', async () => {
    const { service, resolve } = build({ user: owner });
    await expect(service.canSeeHidden(7)).resolves.toBe(true);
    expect(resolve).not.toHaveBeenCalled();
  });
});
