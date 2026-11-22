import { ValidationPipe } from '@nestjs/common';
import { UserPortfolioService } from './user-portfolio.service';
import { IndexPortfolioRequest } from './requests/index-portfolio.request';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { UserRepository } from '../users/users.repository';
import { CollectionService } from '../collections/collection.service';
import { Helpers } from 'src/common/services/helpers.service';
import { PublicViewerService } from 'src/common/services/public-viewer.service';

const build = (canSeeHidden: boolean) => {
  const portfolioRepository = { getAll: jest.fn().mockResolvedValue([]) };
  const svc = new UserPortfolioService(
    portfolioRepository as unknown as PortfolioRepository,
    { findByUsernameCompact: jest.fn().mockResolvedValue({ id: 7, username: 'ana' }) } as unknown as UserRepository,
    {} as unknown as CollectionService,
    { getAsset: jest.fn() } as unknown as Helpers,
    { canSeeHidden: jest.fn().mockResolvedValue(canSeeHidden) } as unknown as PublicViewerService,
  );
  return { svc, portfolioRepository };
};

describe('UserPortfolioService by-username visibility', () => {
  it('AC-2: ignores a forged user_id for an anonymous viewer', async () => {
    const { svc, portfolioRepository } = build(false);
    await svc.getAllByUsername('ana', { user_id: 99 } as never);
    expect(portfolioRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7 }));
  });

  it('AC-2: ignores a forged user_id for the owner', async () => {
    const { svc, portfolioRepository } = build(true);
    await svc.getAllByUsername('ana', { user_id: 99 } as never);
    expect(portfolioRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7 }));
  });

  it('AC-3: anonymous viewers keep the public filters despite is_active/blocked/user_id filters', async () => {
    const { svc, portfolioRepository } = build(false);
    await svc.getAllByUsername('ana', { user_id: 99, is_active: false, blocked: true } as never);
    expect(portfolioRepository.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 7, is_active: true, blocked: false }),
    );
  });

  it('AC-4: the owner gets no public filters and only their own id', async () => {
    const { svc, portfolioRepository } = build(true);
    await svc.getAllByUsername('ana');
    expect(portfolioRepository.getAll).toHaveBeenCalledWith({ user_id: 7 });
  });

  it('AC-4: the owner may still narrow with their own filters', async () => {
    const { svc, portfolioRepository } = build(true);
    await svc.getAllByUsername('ana', { user_id: 99, is_active: false } as never);
    expect(portfolioRepository.getAll).toHaveBeenCalledWith({ user_id: 7, is_active: false });
  });

  it('AC-6: the request DTO strips user_id through the real ValidationPipe config', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true });
    const out = await pipe.transform(
      { user_id: '99', is_active: 'true' },
      { type: 'query', metatype: IndexPortfolioRequest },
    );
    expect(out).not.toHaveProperty('user_id');
    expect(out.is_active).toBe(true);
  });
});
