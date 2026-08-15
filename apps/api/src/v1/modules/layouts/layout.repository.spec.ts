import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from '@repo/backend-lib/services/log-service';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DbException } from '@repo/database/exceptions';
import { Query } from '@repo/database/facades';
import { RequestService } from 'src/common/services/request.service';
import { LayoutRepository } from './layout.repository';

jest.mock('@repo/database/facades', () => ({
  Query: {
    table: jest.fn(),
    raw: jest.fn(),
  },
}));

/** Collapse whitespace so assertions don't depend on how the SQL is indented. */
const sql = (query: string) => query.replace(/\s+/g, ' ').trim();

describe('LayoutRepository', () => {
  let repository: LayoutRepository;
  let configQuery: {
    select: jest.Mock;
    where: jest.Mock;
    first: jest.Mock;
  };

  beforeEach(async () => {
    configQuery = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
    };
    (Query.table as jest.Mock).mockReturnValue(configQuery);
    (Query.raw as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LayoutRepository,
        {
          provide: LogService,
          useValue: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
        {
          provide: RequestService,
          useValue: { pagination: null },
        },
      ],
    }).compile();

    repository = module.get(LayoutRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes the config in a single ON CONFLICT statement', async () => {
    configQuery.first.mockResolvedValueOnce({
      id: 1,
      layout_id: 2,
      portfolio_id: 50,
      config: { columns: 2 },
    });

    const result = await repository.upsertConfigForPortfolio(50, 2, {
      columns: 2,
    });

    expect(Query.raw).toHaveBeenCalledTimes(1);
    const [query, values] = (Query.raw as jest.Mock).mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(sql(query)).toBe(
      `INSERT INTO ${TABLES_ENUM.LAYOUT_CONFIG} (layout_id, portfolio_id, config) ` +
        `VALUES ($1, $2, $3::jsonb) ` +
        `ON CONFLICT (portfolio_id) ` +
        `DO UPDATE SET layout_id = EXCLUDED.layout_id, config = EXCLUDED.config`,
    );
    expect(values).toEqual([2, 50, JSON.stringify({ columns: 2 })]);
    expect(result).toEqual({
      id: 1,
      layout_id: 2,
      portfolio_id: 50,
      config: { columns: 2 },
    });
  });

  // An existing row is the normal case on portfolio update — the same statement rewrites it,
  // so there is no collision to recover from.
  it('overwrites the layout of a portfolio that already has a config row', async () => {
    configQuery.first.mockResolvedValueOnce({
      id: 1,
      layout_id: 3,
      portfolio_id: 50,
      config: { columns: 4 },
    });

    const result = await repository.upsertConfigForPortfolio(50, 3, {
      columns: 4,
    });

    expect(Query.raw).toHaveBeenCalledTimes(1);
    expect((Query.raw as jest.Mock).mock.calls[0][1]).toEqual([
      3,
      50,
      JSON.stringify({ columns: 4 }),
    ]);
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

    expect((Query.raw as jest.Mock).mock.calls[0][1]).toEqual([1, 50, null]);
    expect(result).toEqual({
      id: 1,
      layout_id: 1,
      portfolio_id: 50,
      config: null,
    });
  });

  it('throws when the written row cannot be read back', async () => {
    configQuery.first.mockResolvedValueOnce(null);

    await expect(
      repository.upsertConfigForPortfolio(50, 1, null),
    ).rejects.toThrow(DbException);
  });

  it('propagates write failures', async () => {
    const boom = new Error('connection lost');
    (Query.raw as jest.Mock).mockRejectedValueOnce(boom);

    await expect(
      repository.upsertConfigForPortfolio(50, 1, null),
    ).rejects.toBe(boom);
  });
});
