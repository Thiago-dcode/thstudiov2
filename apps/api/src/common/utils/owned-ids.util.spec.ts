const query = {
  whereIn: jest.fn(),
  where: jest.fn(),
  count: jest.fn(),
};
jest.mock('@repo/database/facades', () => ({
  Query: { table: jest.fn(() => query) },
}));

import { BadRequestException } from '@nestjs/common';
import { Query } from '@repo/database/facades';
import { assertOwnedIds } from './owned-ids.util';

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
