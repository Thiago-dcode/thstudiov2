import * as fs from 'node:fs';
import * as path from 'node:path';
import { ApiException } from 'src/common/exceptions/api-exception';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { PlansService } from '../plans/plans.service';
import { UserStorageRequestService } from '../user-storage-requests/user-storage-request.service';
import { Helpers } from 'src/common/services/helpers.service';

const plan = {
  name: 'Artist', storage_limit_mb: 10240, ai_credits: 20, limit_write_storage_per_day: 50,
  max_portfolios: 3, max_collections: 3, max_services: 3, max_projects: 0, max_clients: 0,
};
const extra = {
  storage_used_mb: 0, ai_credits: 0, ai_credits_consumed: 0, account_strikes: 0, ban_lift: null,
  portfolios_count: 3, collections_count: 3, services_count: 3, projects_count: 99, clients_count: 99,
};

const build = () => {
  const service = new UserExtraDataService(
    {} as unknown as UserExtraDataRepository,
    {} as UserStorageRequestService,
    { findUserActivePlan: jest.fn().mockResolvedValue(plan) } as unknown as PlansService,
    { cacheRemember: jest.fn() } as unknown as Helpers,
  );
  jest.spyOn(service, 'findOneByUserId').mockResolvedValue(extra as any);
  return service;
};

describe('UserExtraDataService.enforceUserLimits', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-15: a projects_count option is ignored (projects are no longer a plan limit)', async () => {
    const service = build();
    // Cast: the option no longer exists on the type, which is the point.
    await expect(service.enforceUserLimits(7, { projects_count: 1 } as any)).resolves.toBeUndefined();
  });

  it('AC-15: the source no longer reads projects_count in enforceUserLimits', () => {
    const source = fs.readFileSync(path.join(__dirname, 'user-extra-data.service.ts'), 'utf8');
    const start = source.indexOf('async enforceUserLimits(');
    const end = source.indexOf('async enforceEntityLimit(');
    expect(start).toBeGreaterThan(-1);
    expect(source.slice(start, end)).not.toMatch(/projects_count|clients_count|max_projects|max_clients/);
  });

  it.each([
    ['portfolios_count'],
    ['collections_count'],
    ['services_count'],
  ])('AC-15: %s enforcement is unchanged (at the cap, one more is rejected)', async (option) => {
    const service = build();
    await expect(service.enforceUserLimits(7, { [option]: 1 })).rejects.toBeInstanceOf(ApiException);
  });
});
