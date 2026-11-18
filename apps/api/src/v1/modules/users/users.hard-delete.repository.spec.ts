jest.mock('@repo/database/facades', () => ({
  Query: { table: jest.fn(), raw: jest.fn() },
}));

import { Query } from '@repo/database/facades';
import { UserRepository } from './users.repository';

describe('UserRepository.hardDeleteById', () => {
  const raw = Query.raw as jest.Mock;
  const repository = new UserRepository({} as never);

  beforeEach(() => {
    raw.mockReset();
    raw.mockResolvedValue({ rows: [{ id: 7 }] });
  });

  it('only deletes a flagged, due account and binds the grace days', async () => {
    await expect(repository.hardDeleteById(7, 15)).resolves.toBe(true);

    const [sql, bindings] = raw.mock.calls[0];
    expect(sql).toContain('$2');
    expect(sql).toMatch(/deletion_requested_at/);
    expect(bindings).toEqual([7, 15]);
  });

  it('forced: drops the due predicate and binds only the id', async () => {
    await expect(repository.hardDeleteById(7, 15, { force: true })).resolves.toBe(true);

    const [sql, bindings] = raw.mock.calls[0];
    // Postgres rejects a bind count that does not match the placeholders.
    expect(sql).not.toContain('$2');
    expect(sql).not.toMatch(/deletion_requested_at/);
    expect(sql).toContain('FOR UPDATE');
    expect(bindings).toEqual([7]);
  });

  it('reports false when no row was deleted', async () => {
    raw.mockResolvedValue({ rows: [] });

    await expect(repository.hardDeleteById(7, 15, { force: true })).resolves.toBe(false);
  });
});
