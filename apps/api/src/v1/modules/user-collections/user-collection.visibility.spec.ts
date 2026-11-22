import { ValidationPipe } from '@nestjs/common';
import { UserCollectionService } from './user-collection.service';
import { IndexUserCollectionRequest } from './requests/index-user-collection.request';
import { CollectionRepository } from '../collections/collection.repository';
import { UserRepository } from '../users/users.repository';
import { Helpers } from 'src/common/services/helpers.service';
import { PublicViewerService } from 'src/common/services/public-viewer.service';

const build = (canSeeHidden: boolean) => {
  const collectionRepository = { getAll: jest.fn().mockResolvedValue([]) };
  const svc = new UserCollectionService(
    collectionRepository as unknown as CollectionRepository,
    { findByUsernameCompact: jest.fn().mockResolvedValue({ id: 7, username: 'ana' }) } as unknown as UserRepository,
    { getAsset: jest.fn() } as unknown as Helpers,
    { canSeeHidden: jest.fn().mockResolvedValue(canSeeHidden) } as unknown as PublicViewerService,
  );
  return { svc, collectionRepository };
};

describe('UserCollectionService by-username visibility', () => {
  it('AC-1: ignores a forged user_id for an anonymous viewer', async () => {
    const { svc, collectionRepository } = build(false);
    await svc.getAllByUsername('ana', { user_id: 99 } as never);
    expect(collectionRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7 }));
  });

  it('AC-1: ignores a forged user_id for the owner', async () => {
    const { svc, collectionRepository } = build(true);
    await svc.getAllByUsername('ana', { user_id: 99 } as never);
    expect(collectionRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7 }));
  });

  it('AC-3: anonymous viewers keep the public filters despite is_active/blocked/user_id filters', async () => {
    const { svc, collectionRepository } = build(false);
    await svc.getAllByUsername('ana', { user_id: 99, is_active: false, blocked: true } as never);
    expect(collectionRepository.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 7, is_active: true, blocked: false }),
    );
  });

  it('AC-4: the owner gets no public filters and only their own id', async () => {
    const { svc, collectionRepository } = build(true);
    await svc.getAllByUsername('ana');
    expect(collectionRepository.getAll).toHaveBeenCalledWith({ user_id: 7 });
  });

  it('AC-4: the owner may still narrow with their own filters', async () => {
    const { svc, collectionRepository } = build(true);
    await svc.getAllByUsername('ana', { user_id: 99, is_active: false } as never);
    expect(collectionRepository.getAll).toHaveBeenCalledWith({ user_id: 7, is_active: false });
  });

  it('AC-6: the request DTO strips user_id through the real ValidationPipe config', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true });
    const out = await pipe.transform(
      { user_id: '99', is_active: 'true' },
      { type: 'query', metatype: IndexUserCollectionRequest },
    );
    expect(out).not.toHaveProperty('user_id');
    expect(out.is_active).toBe(true);
  });
});
