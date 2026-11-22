const query = {
  whereIn: jest.fn(),
  where: jest.fn(),
  count: jest.fn(),
  select: jest.fn(),
  get: jest.fn(),
};
jest.mock('@repo/database/facades', () => ({
  Query: { table: jest.fn(() => query) },
}));

import { BadRequestException } from '@nestjs/common';
import { Query } from '@repo/database/facades';
import { assertOwnedIds, classifyOwnedIds } from './owned-ids.util';

describe('assertOwnedIds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.whereIn.mockReturnValue(query);
    query.where.mockReturnValue(query);
  });

  it('passes when every id belongs to the user', async () => {
    query.count.mockResolvedValue(2);

    await expect(assertOwnedIds('media', [4, 5, 5], 7, 'Media')).resolves.toBeUndefined();

    expect(Query.table).toHaveBeenCalledWith('media');
    expect(query.whereIn).toHaveBeenCalledWith('id', [4, 5]);
    expect(query.where).toHaveBeenCalledWith('user_id', '=', 7);
  });

  // Another artist's media id exists, so @ModelExist accepts it; ownership must reject it.
  it('rejects a list containing another user’s id', async () => {
    query.count.mockResolvedValue(1);

    await expect(assertOwnedIds('media', [4, 900], 7, 'Media')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('skips the query for an empty list', async () => {
    await assertOwnedIds('media', [], 7, 'Media');

    expect(Query.table).not.toHaveBeenCalled();
  });
});

describe('classifyOwnedIds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.select.mockReturnValue(query);
    query.whereIn.mockReturnValue(query);
  });

  it('AC-2/AC-3: splits ids into missing and foreign with ONE query, deduplicating the input', async () => {
    query.get.mockResolvedValue([
      { id: 1, user_id: 7 },
      { id: 2, user_id: 99 },
    ]);
    const out = await classifyOwnedIds('portfolios', [1, 2, 2, 3], 7);
    expect(out).toEqual({ missing: [3], foreign: [2] });
    expect(query.get).toHaveBeenCalledTimes(1);
    expect(query.whereIn).toHaveBeenCalledWith('id', [1, 2, 3]);
  });

  it('AC-1: all owned -> nothing missing, nothing foreign', async () => {
    query.get.mockResolvedValue([
      { id: 1, user_id: 7 },
      { id: 2, user_id: 7 },
    ]);
    await expect(classifyOwnedIds('portfolios', [1, 2], 7)).resolves.toEqual({ missing: [], foreign: [] });
  });

  it('AC-2: tolerates string ids/user_ids from the driver when comparing the owner', async () => {
    query.get.mockResolvedValue([{ id: '1', user_id: '7' }]);
    await expect(classifyOwnedIds('portfolios', [1], 7)).resolves.toEqual({ missing: [], foreign: [] });
  });

  it('an empty id list does not query', async () => {
    await expect(classifyOwnedIds('portfolios', [], 7)).resolves.toEqual({ missing: [], foreign: [] });
    expect(Query.table).not.toHaveBeenCalled();
  });
});
