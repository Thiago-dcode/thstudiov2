import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from '@repo/backend-lib/services/log-service';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Query } from '@repo/database/facades';
import { LayoutRepository } from './layout.repository';

jest.mock('@repo/database/facades', () => ({
  Query: {
    table: jest.fn(),
  },
}));

describe('LayoutRepository', () => {
  let repository: LayoutRepository;
  let configQuery: {
    select: jest.Mock;
    where: jest.Mock;
    first: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
  };

  beforeEach(async () => {
    configQuery = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    (Query.table as jest.Mock).mockReturnValue(configQuery);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LayoutRepository,
        {
          provide: LogService,
          useValue: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile();

    repository = module.get(LayoutRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a new layout_config when none exists for the portfolio', async () => {
    configQuery.first.mockResolvedValueOnce({
      id: 1,
      layout_id: 2,
      portfolio_id: 50,
      config: { columns: 2 },
    });

    const result = await repository.upsertConfigForPortfolio(50, 2, {
      columns: 2,
    });

    expect(Query.table).toHaveBeenCalledWith(TABLES_ENUM.LAYOUT_CONFIG);
    expect(configQuery.insert).toHaveBeenCalledWith(
      ['layout_id', 'portfolio_id', 'config'],
      [2, 50, JSON.stringify({ columns: 2 })],
    );
    expect(configQuery.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 1,
      layout_id: 2,
      portfolio_id: 50,
      config: { columns: 2 },
    });
  });

  it('updates an existing layout_config on unique violation', async () => {
    configQuery.insert.mockRejectedValueOnce({ code: '23505' });
    configQuery.first.mockResolvedValueOnce({
      id: 1,
      layout_id: 3,
      portfolio_id: 50,
      config: { columns: 4 },
    });

    const result = await repository.upsertConfigForPortfolio(50, 3, {
      columns: 4,
    });

    expect(configQuery.insert).toHaveBeenCalled();
    expect(configQuery.update).toHaveBeenCalledWith(
      ['layout_id', 'config'],
      [3, JSON.stringify({ columns: 4 })],
    );
    expect(result).toEqual({
      id: 1,
      layout_id: 3,
      portfolio_id: 50,
      config: { columns: 4 },
    });
  });

  it('stores null config as literal null (not the string "null")', async () => {
    configQuery.first.mockResolvedValueOnce({
      id: 1,
      layout_id: 1,
      portfolio_id: 50,
      config: null,
    });

    const result = await repository.upsertConfigForPortfolio(50, 1, null);

    expect(configQuery.insert).toHaveBeenCalledWith(
      ['layout_id', 'portfolio_id', 'config'],
      [1, 50, null],
    );
    expect(result).toEqual({
      id: 1,
      layout_id: 1,
      portfolio_id: 50,
      config: null,
    });
  });

  it('rethrows non-unique-violation insert errors', async () => {
    const boom = new Error('connection lost');
    configQuery.insert.mockRejectedValueOnce(boom);

    await expect(
      repository.upsertConfigForPortfolio(50, 1, null),
    ).rejects.toBe(boom);
    expect(configQuery.update).not.toHaveBeenCalled();
  });
});
