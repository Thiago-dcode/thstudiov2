import { ApiException } from 'src/common/exceptions/api-exception';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { PlansService } from '../plans/plans.service';
import { UserStorageRequestService } from '../user-storage-requests/user-storage-request.service';
import { Helpers } from 'src/common/services/helpers.service';

const plan = { max_collections: 3, max_portfolios: 2, max_services: -1 };

const build = (liveCount: number) => {
  const repo = { countLiveEntities: jest.fn().mockResolvedValue(liveCount) };
  const helpers = { cacheRemember: jest.fn() };
  const service = new UserExtraDataService(
    repo as unknown as UserExtraDataRepository,
    {} as UserStorageRequestService,
    { findUserActivePlan: jest.fn().mockResolvedValue(plan) } as unknown as PlansService,
    helpers as unknown as Helpers,
  );
  return { service, repo, helpers };
};

describe('UserExtraDataService.enforceEntityLimit', () => {
  it('allows a create below the cap, counting live rows instead of the cached counter', async () => {
    const { service, repo, helpers } = build(2);
    await expect(service.enforceEntityLimit(7, 'collections')).resolves.toBeUndefined();
    expect(repo.countLiveEntities).toHaveBeenCalledWith(7, 'collections');
    expect(helpers.cacheRemember).not.toHaveBeenCalled();
  });

  it('rejects a create at the cap', async () => {
    const { service } = build(2);
    await expect(service.enforceEntityLimit(7, 'portfolios')).rejects.toBeInstanceOf(ApiException);
  });

  it('treats -1 as unlimited', async () => {
    const { service } = build(500);
    await expect(service.enforceEntityLimit(7, 'services')).resolves.toBeUndefined();
  });
});
