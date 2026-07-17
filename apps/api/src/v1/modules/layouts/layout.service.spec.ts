import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Helpers } from 'src/common/services/helpers.service';
import { LayoutService } from './layout.service';
import { LayoutRepository } from './layout.repository';

describe('LayoutService', () => {
  let service: LayoutService;
  let layoutRepository: {
    findAllActive: jest.Mock;
    findById: jest.Mock;
    findByName: jest.Mock;
    upsertConfigForPortfolio: jest.Mock;
  };
  let helpers: {
    cacheRemember: jest.Mock;
  };

  const masonryLayout = { id: 1, name: 'MASONRY' as const, is_active: true };
  const uniformLayout = { id: 2, name: 'UNIFORM' as const, is_active: true };
  const columnBaseLayout = {
    id: 3,
    name: 'COLUMN_BASE' as const,
    is_active: true,
  };

  beforeEach(async () => {
    layoutRepository = {
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      upsertConfigForPortfolio: jest.fn(),
    };
    helpers = {
      cacheRemember: jest.fn((_key, promise) => promise),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LayoutService,
        { provide: LayoutRepository, useValue: layoutRepository },
        { provide: Helpers, useValue: helpers },
      ],
    }).compile();

    service = module.get(LayoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveLayoutConfig', () => {
    it('defaults to MASONRY with null config when layoutId is undefined', async () => {
      layoutRepository.findByName.mockResolvedValue(masonryLayout);

      const result = await service.resolveLayoutConfig(undefined);

      expect(layoutRepository.findByName).toHaveBeenCalledWith('MASONRY');
      expect(result).toEqual({
        layout: masonryLayout,
        config: null,
      });
    });

    it('normalizes UNIFORM config to null', async () => {
      layoutRepository.findById.mockResolvedValue(uniformLayout);

      const result = await service.resolveLayoutConfig(2, { columns: 4 });

      expect(result).toEqual({
        layout: uniformLayout,
        config: null,
      });
    });

    it('clamps COLUMN_BASE columns below min to 1', async () => {
      layoutRepository.findById.mockResolvedValue(columnBaseLayout);

      const result = await service.resolveLayoutConfig(3, { columns: 0 });

      expect(result).toEqual({
        layout: columnBaseLayout,
        config: { columns: 1 },
      });
    });

    it('clamps COLUMN_BASE columns above max to 12', async () => {
      layoutRepository.findById.mockResolvedValue(columnBaseLayout);

      const result = await service.resolveLayoutConfig(3, { columns: 13 });

      expect(result).toEqual({
        layout: columnBaseLayout,
        config: { columns: 12 },
      });
    });

    it('accepts valid COLUMN_BASE config', async () => {
      layoutRepository.findById.mockResolvedValue(columnBaseLayout);

      const result = await service.resolveLayoutConfig(3, { columns: 3 });

      expect(result).toEqual({
        layout: columnBaseLayout,
        config: { columns: 3 },
      });
    });

    it('throws when COLUMN_BASE columns is not a number', async () => {
      layoutRepository.findById.mockResolvedValue(columnBaseLayout);

      await expect(
        service.resolveLayoutConfig(3, { columns: 'abc' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when layout id does not exist', async () => {
      layoutRepository.findById.mockResolvedValue(null);

      await expect(
        service.resolveLayoutConfig(999, {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('persistConfig', () => {
    it('delegates to repository upsert', async () => {
      layoutRepository.upsertConfigForPortfolio.mockResolvedValue({
        id: 10,
        layout_id: 1,
        portfolio_id: 99,
        config: null,
      });

      await service.persistConfig(masonryLayout, 99, null);

      expect(layoutRepository.upsertConfigForPortfolio).toHaveBeenCalledWith(
        99,
        1,
        null,
      );
    });
  });
});
