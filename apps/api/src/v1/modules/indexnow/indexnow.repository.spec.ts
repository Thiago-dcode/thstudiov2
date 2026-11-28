import { Query } from '@repo/database/facades';
import { IndexNowRepository } from './indexnow.repository';

/**
 * AC-19: the IndexNow path SQL builds root URLs. The DB client is the only mock: the query text is
 * what the repository owns, so the spec reads it, and the rows come back through the same shape the
 * real client returns.
 */
describe('IndexNowRepository.changedPathsSince (AC-19)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-19: every kind selects a root path and none builds /artists/', async () => {
    const raw = jest.spyOn(Query, 'raw').mockResolvedValue({ rows: [] } as never);

    await new IndexNowRepository().changedPathsSince(new Date('2026-01-01T00:00:00Z'), 50);

    const [sql, params] = raw.mock.calls[0] as unknown as [string, unknown[]];
    expect(sql).not.toContain('/artists');
    expect(params).toEqual(['2026-01-01T00:00:00.000Z', 50]);
    expect(sql).toContain("('/' || u.username) AS path");
    expect(sql).toContain("('/' || u.username) || '/portfolios/' || p.slug");
    expect(sql).toContain("('/' || u.username) || '/collections/' || c.slug");
    expect(sql).toContain("('/' || u.username) || '/services/' || s.slug");
    expect(sql).toContain("('/' || u.username) || '/media/' || m.public_id");
  });

  it('AC-19: returns the paths the database produced, in order', async () => {
    jest.spyOn(Query, 'raw').mockResolvedValue({
      rows: [{ path: '/thsworld' }, { path: '/thsworld/portfolios/x' }, { path: '/thsworld/media/abc' }],
    } as never);

    await expect(new IndexNowRepository().changedPathsSince(new Date(), 10)).resolves.toEqual([
      '/thsworld',
      '/thsworld/portfolios/x',
      '/thsworld/media/abc',
    ]);
  });
});
