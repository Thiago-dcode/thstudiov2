import { CollectionService } from './collection.service';
import { CollectionRepository } from './collection.repository';
import { RequestService } from 'src/common/services/request.service';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { Helpers } from 'src/common/services/helpers.service';
import { PublicViewerService } from 'src/common/services/public-viewer.service';

const build = (canSeeHidden: boolean) => {
  const collectionRepository = { getAll: jest.fn().mockResolvedValue([]) };
  const service = new CollectionService(
    collectionRepository as unknown as CollectionRepository,
    {} as RequestService,
    {} as UserExtraDataService,
    { getAsset: jest.fn() } as unknown as Helpers,
    { canSeeHidden: jest.fn().mockResolvedValue(canSeeHidden) } as unknown as PublicViewerService,
  );
  return { service, collectionRepository };
};

describe('CollectionService.findAll visibility', () => {
  it('pages a visitor list across every artist and keeps it to public collections', async () => {
    const { service, collectionRepository } = build(false);
    await service.findAll({ paginated: false, is_active: false } as never);
    expect(collectionRepository.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ paginated: true, is_active: true, blocked: false }),
      { visibleAccountsOnly: true },
    );
  });

  it('leaves a visitor list of one artist unpaged but public only', async () => {
    const { service, collectionRepository } = build(false);
    await service.findAll({ user_id: 7 } as never);
    const [filters] = collectionRepository.getAll.mock.calls[0];
    expect(filters).toMatchObject({ user_id: 7, is_active: true, blocked: false });
    expect(filters.paginated).toBeUndefined();
  });

  it('gives the owner their list as asked', async () => {
    const { service, collectionRepository } = build(true);
    await service.findAll({ user_id: 7, is_active: false } as never);
    expect(collectionRepository.getAll).toHaveBeenCalledWith({ user_id: 7, is_active: false });
  });
});
