import { UserServiceService } from './user-service.service';
import { ServiceRepository } from '../services/service.repository';
import { UserRepository } from '../users/users.repository';
import { Helpers } from 'src/common/services/helpers.service';
import { PublicViewerService } from 'src/common/services/public-viewer.service';

const build = (canSeeHidden: boolean, service: Record<string, unknown> | null = null) => {
  const serviceRepository = {
    getAll: jest.fn().mockResolvedValue([]),
    getBySlug: jest.fn().mockResolvedValue(service),
  };
  const helpers = {
    cacheRemember: jest.fn((_key: string, value: Promise<unknown>) => value),
    getAsset: jest.fn(),
  };
  const svc = new UserServiceService(
    serviceRepository as unknown as ServiceRepository,
    { findByUsernameCompact: jest.fn().mockResolvedValue({ id: 7, username: 'ana' }) } as unknown as UserRepository,
    helpers as unknown as Helpers,
    { canSeeHidden: jest.fn().mockResolvedValue(canSeeHidden) } as unknown as PublicViewerService,
  );
  return { svc, serviceRepository, helpers };
};

describe('UserServiceService visibility', () => {
  it('gives visitors only active, unblocked services, even when they ask for the rest', async () => {
    const { svc, serviceRepository } = build(false);
    await svc.getAllByUsername('ana', { is_active: false, blocked: true });
    expect(serviceRepository.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 7, is_active: true, blocked: false }),
    );
  });

  it('caches the default visitor list as the public list only', async () => {
    const { svc, serviceRepository, helpers } = build(false);
    await svc.getAllByUsername('ana');
    expect(helpers.cacheRemember).toHaveBeenCalledWith('services-user-public-7', expect.anything(), expect.anything());
    expect(serviceRepository.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true, blocked: false }),
    );
  });

  it('gives the owner every service, uncached', async () => {
    const { svc, serviceRepository, helpers } = build(true);
    await svc.getAllByUsername('ana');
    expect(helpers.cacheRemember).not.toHaveBeenCalled();
    expect(serviceRepository.getAll).toHaveBeenCalledWith({ user_id: 7 });
  });

  it('404s an inactive or blocked service for visitors but not for the owner', async () => {
    const inactive = { id: 1, user_id: 7, is_active: false, blocked_at: null };
    await expect(build(false, inactive).svc.getByUsername('ana', 's')).resolves.toBeNull();
    const blocked = { id: 1, user_id: 7, is_active: true, blocked_at: new Date() };
    await expect(build(false, blocked).svc.getByUsername('ana', 's')).resolves.toBeNull();
    await expect(build(true, inactive).svc.getByUsername('ana', 's')).resolves.toMatchObject({ id: 1 });
  });
});
