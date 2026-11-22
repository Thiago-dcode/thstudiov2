jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import { CollectionRepository } from './collection.repository';

type Call = [method: string, ...args: unknown[]];

/** A chainable stand-in for QueryBuilder that records every call in order. */
const recorder = (getResult: unknown[] = []) => {
  const calls: Call[] = [];
  const query: any = new Proxy(
    {},
    {
      get: (_t, method: string) => {
        if (method === 'then') return undefined;
        return (...args: unknown[]) => {
          calls.push([method, ...args]);
          if (method === 'count') return Promise.resolve(10);
          if (method === 'get') return Promise.resolve(getResult);
          return query;
        };
      },
    },
  );
  return { query, calls };
};

const orderBys = (calls: Call[]) =>
  calls.filter(([m]) => m === 'orderBy').map(([, col, dir]) => `${col} ${dir}`);

const buildRepo = () => {
  const requestService = { pagination: undefined } as any;
  const repository = new CollectionRepository(requestService);
  const applyFilters = async (filters: Record<string, unknown>) => {
    const { query, calls } = recorder();
    await (repository as any).applyFilters(filters, query, {});
    return { calls, order: orderBys(calls) };
  };
  /** Runs getAllPaginated with phase 1 returning one id; returns the recorded call lists per phase. */
  const paginated = async (filters: Record<string, unknown>) => {
    const phases: ReturnType<typeof recorder>[] = [
      recorder([{ id: 1 }, { id: 2 }]),
      recorder([]),
    ];
    let i = 0;
    jest.spyOn(repository as any, 'query').mockImplementation(() => phases[i++].query);
    await repository.getAll({ paginated: true, per_page: 5, ...filters } as never);
    return { phase1: orderBys(phases[0].calls), phase2: orderBys(phases[1].calls), phases };
  };
  return { repository, applyFilters, paginated };
};

describe('CollectionRepository ordering', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-1/AC-8: a single-artist unpaged list orders by position, created_at, id, then pivot position last', async () => {
    const { applyFilters } = buildRepo();
    const { order } = await applyFilters({ user_id: 5 });
    expect(order[0]).toBe('collections.position ASC');
    expect(order[order.length - 1]).toBe('collection_media.position ASC');
    expect(order).toEqual([
      'collections.position ASC',
      'created_at DESC',
      'collections.id DESC',
      'collection_media.position ASC',
    ]);
  });

  it('AC-8: a cross-artist unpaged list keeps exactly the previous ORDER BY', async () => {
    const { applyFilters } = buildRepo();
    const { order } = await applyFilters({});
    expect(order).toEqual(['created_at DESC', 'collection_media.position ASC']);
  });

  it('AC-8: a single-artist paged list: phase 1 has position before id DESC, phase 2 mirrors it', async () => {
    const { paginated } = buildRepo();
    const { phase1, phase2 } = await paginated({ user_id: 5, is_highlight: true });
    expect(phase1[0]).toBe('collections.position ASC');
    const posIdx = phase1.indexOf('collections.position ASC');
    const idIdx = phase1.findIndex((o) => /\bid DESC$/.test(o));
    expect(idIdx).toBeGreaterThan(posIdx);
    expect(phase1[phase1.length - 1]).toBe('created_at DESC');

    expect(phase2).toEqual([
      'collections.position ASC',
      'collections.id DESC',
      'created_at DESC',
      'collection_media.position ASC',
    ]);
    // Phases agree: the leading terms of phase 1 are the same ones phase 2 starts with.
    expect(phase2.slice(0, 2)).toEqual([phase1[0], 'collections.id DESC']);
  });

  it('AC-8: a cross-artist paged list never orders by collections.position and keeps today\'s order', async () => {
    const { paginated } = buildRepo();
    const { phase1, phase2 } = await paginated({});
    expect(phase1.some((o) => o.startsWith('collections.position'))).toBe(false);
    expect(phase1[phase1.length - 1]).toBe('created_at DESC');
    expect(phase2).toEqual(['created_at DESC', 'collection_media.position ASC']);
  });
});

describe('CollectionRepository column collision', () => {
  const baseRow = (over: Record<string, unknown>) => ({
    id: 1,
    slug: 'work',
    title: 'Work',
    is_featured: false,
    is_highlight: false,
    is_active: true,
    is_indexable: true,
    position: 3,
    seo_title: null,
    seo_description: null,
    seo_generated_at: null,
    description: null,
    blocked_at: null,
    user_id: 5,
    created_at: 'c',
    updated_at: 'u',
    ...over,
  });

  it('AC-9: the selects alias the pivot position and keep collections.position', () => {
    const { repository } = buildRepo();
    for (const key of ['BASE_COLUMNS', 'COLUMNS', 'FULL_COLUMNS']) {
      const cols: string[] = (repository as any)[key];
      expect(cols).toContain('collections.position');
      expect(cols).not.toContain('collection_media.position');
      if (key !== 'BASE_COLUMNS') expect(cols).toContain('collection_media.position as cm_position');
    }
  });

  it('AC-9: list items carry collections.position, and media[].position is the pivot position', () => {
    const { repository } = buildRepo();
    const list = (repository as any).formatCollections([
      baseRow({ m_id: 10, cm_position: 0, thumbnail: 'a', m_title: 'a' }),
      baseRow({ m_id: 11, cm_position: 1, thumbnail: 'b', m_title: 'b' }),
      baseRow({ id: 2, position: 8, m_id: 12, cm_position: 0, thumbnail: 'c', m_title: 'c' }),
    ]);
    expect(list.map((c: any) => c.position)).toEqual([3, 8]);
    expect(list[0].media.map((m: any) => m.position)).toEqual([0, 1]);
  });

  it('AC-9: the full collection keeps collections.position and the pivot media order', () => {
    const { repository } = buildRepo();
    const full = (repository as any).formatFullCollection([
      baseRow({ m_id: 10, cm_position: 0 }),
      baseRow({ m_id: 11, cm_position: 1 }),
      baseRow({ m_id: 12, cm_position: 2 }),
    ]);
    expect(full.position).toBe(3);
    expect(full.media.map((m: any) => m.position)).toEqual([0, 1, 2]);
  });

  it('AC-9: findPortfolioCollections reports the portfolio pivot as the collection position and the cm pivot for media', () => {
    const { repository } = buildRepo();
    const out = (repository as any).formatPortfolioCollections([
      baseRow({ pc_position: 4, m_id: 10, cm_position: 0 }),
      baseRow({ pc_position: 4, m_id: 11, cm_position: 1 }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].position).toBe(4);
    expect(out[0].media.map((m: any) => m.position)).toEqual([0, 1]);
  });

  it('AC-9: the base collection exposes position', () => {
    const { repository } = buildRepo();
    expect((repository as any).formatBaseCollection(baseRow({ position: 6 })).position).toBe(6);
  });
});

describe('CollectionRepository writes', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-6: updatePositions delegates to the owner-scoped helper and keeps a fresh SEO stamp', async () => {
    const { repository } = buildRepo();
    const spy = jest.spyOn(repository as any, 'updatePositionsForOwner').mockResolvedValue(2);
    const items = [{ module_id: 1, position: 0 }];
    await expect(repository.updatePositions(9, items)).resolves.toBe(2);
    expect(spy).toHaveBeenCalledWith(9, items, { seoStampColumn: 'seo_generated_at' });
  });

  it('AC-11/AC-15: updateStatus delegates to the owner-scoped helper and keeps a fresh SEO stamp', async () => {
    const { repository } = buildRepo();
    const result = { id: 5, is_highlight: true, is_active: true };
    const spy = jest.spyOn(repository as any, 'updateStatusForOwner').mockResolvedValue(result);
    await expect(repository.updateStatus(5, 9, { is_highlight: true })).resolves.toEqual(result);
    expect(spy).toHaveBeenCalledWith(5, 9, { is_highlight: true }, { seoStampColumn: 'seo_generated_at' });
  });
});
