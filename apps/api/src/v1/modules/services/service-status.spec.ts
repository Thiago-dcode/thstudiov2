jest.mock('src/common/utils/user-lock', () => ({
  ENTITY_CREATE_LOCK_TTL_MS: 1000,
  withUserLock: (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
}));
jest.mock('src/common/utils/owned-ids.util', () => ({
  assertOwnedIds: jest.fn().mockResolvedValue(undefined),
  classifyOwnedIds: jest.fn(),
}));
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'uuid'),
}));

import { BadRequestException } from '@nestjs/common';
import { MAX_HIGHLIGHT_SERVICES } from '@repo/common-lib/constants/highlights';
import { CACHE_KEY_SERVICE_SEO } from '@repo/common-lib/constants/cache';
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from '@repo/common-lib/constants/events';
import { consoleRequestService } from 'src/common/testing/console-logger';
import { ApiException } from 'src/common/exceptions/api-exception';
import { ArtistPublicPagesChangedEvent } from '../edge-cache/events/artist-public-pages-changed.event';
import { serviceCacheKeys } from '../user-services/user-service.service';
import { ServiceService } from './service.service';

const OWNER = 7;
const SLUG = 'portrait-session';

type Current = { id: number; user_id: number; slug: string; is_highlight: boolean; is_active: boolean } | null;

const build = (opts: { current?: Current; highlightCount?: number; updated?: unknown } = {}) => {
  const lines: any[] = [];
  for (const method of ['log', 'warn', 'error', 'debug'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try {
        lines.push(JSON.parse(String(line)));
      } catch {
        /* not a log line */
      }
    });
  }
  const current: Current =
    opts.current === undefined
      ? { id: 5, user_id: OWNER, slug: SLUG, is_highlight: false, is_active: true }
      : opts.current;
  const emitter = { emit: jest.fn() };
  const repository = {
    getOneCompact: jest.fn().mockResolvedValue(current),
    countHighlights: jest.fn().mockResolvedValue(opts.highlightCount ?? 0),
    updateStatus: jest
      .fn()
      .mockResolvedValue(opts.updated === undefined ? { id: 5, is_highlight: true, is_active: true } : opts.updated),
    updateById: jest.fn(),
    replaceFeatures: jest.fn(),
    replaceTerms: jest.fn(),
  };
  const helpers = {
    deleteCached: jest.fn().mockResolvedValue(undefined),
    deleteManyCached: jest.fn().mockResolvedValue(undefined),
  };
  const requestService = consoleRequestService();
  Object.defineProperty(requestService, 'user', { value: { id: OWNER }, configurable: true });
  const service = new ServiceService(
    repository as never,
    requestService,
    {} as never,
    helpers as never,
    {} as never,
    emitter as never,
  );
  return { service, repository, emitter, helpers, lines };
};

const criticals = (lines: any[]) => lines.filter((l) => String(l.level).toUpperCase() === 'CRITICAL');
const purges = (emitter: { emit: jest.Mock }) =>
  emitter.emit.mock.calls.filter(([name]) => name === ARTIST_PUBLIC_PAGES_CHANGED_EVENT);
/** Every key passed to deleteManyCached / deleteCached, flattened. */
const deletedKeys = (helpers: { deleteCached: jest.Mock; deleteManyCached: jest.Mock }) => [
  ...helpers.deleteManyCached.mock.calls.flatMap(([keys]) => keys as string[]),
  ...helpers.deleteCached.mock.calls.map(([key]) => key as string),
];

describe('ServiceService.updateStatus', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-11: passes only the sent keys to the repository and returns { id, is_highlight, is_active }', async () => {
    const { service, repository } = build({ updated: { id: 5, is_highlight: false, is_active: false } });

    await expect(service.updateStatus(5, { is_active: false } as never)).resolves.toEqual({
      id: 5,
      is_highlight: false,
      is_active: false,
    });

    expect(repository.updateStatus).toHaveBeenCalledTimes(1);
    const [id, userId, input] = repository.updateStatus.mock.calls[0];
    expect([id, userId]).toEqual([5, OWNER]);
    expect(Object.keys(input)).toEqual(['is_active']);
    // The full-replace path (which rewrites features and terms) must never be used for a toggle.
    expect(repository.updateById).not.toHaveBeenCalled();
  });

  it('AC-12: an empty body -> 400 and nothing is read or written', async () => {
    const { service, repository, emitter } = build();
    await expect(service.updateStatus(5, {} as never)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.updateStatus(5, {} as never)).rejects.toThrow('Nothing to update');
    expect(repository.getOneCompact).not.toHaveBeenCalled();
    expect(repository.updateStatus).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('AC-13: highlight on at MAX_HIGHLIGHT_SERVICES -> maxHighlights, nothing written, no side effects', async () => {
    expect(MAX_HIGHLIGHT_SERVICES).toBe(5);
    const { service, repository, emitter, helpers } = build({ highlightCount: MAX_HIGHLIGHT_SERVICES });
    const expected = ApiException.maxHighlights('x');

    const attempt = service.updateStatus(5, { is_highlight: true } as never);
    await expect(attempt).rejects.toBeInstanceOf(ApiException);
    await expect(attempt).rejects.toMatchObject({ status: expected.getStatus() });

    expect(repository.updateStatus).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
    expect(deletedKeys(helpers)).toHaveLength(0);
  });

  it('AC-13: one below the limit is accepted', async () => {
    const { service, repository } = build({ highlightCount: MAX_HIGHLIGHT_SERVICES - 1 });
    await service.updateStatus(5, { is_highlight: true } as never);
    expect(repository.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('AC-13: re-sending true for an already highlighted service at the limit is accepted', async () => {
    const { service, repository } = build({
      current: { id: 5, user_id: OWNER, slug: SLUG, is_highlight: true, is_active: true },
      highlightCount: MAX_HIGHLIGHT_SERVICES,
      updated: null,
    });
    await expect(service.updateStatus(5, { is_highlight: true } as never)).resolves.toEqual({
      id: 5,
      is_highlight: true,
      is_active: true,
    });
    expect(repository.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('AC-13: turning highlight OFF never hits the limit check', async () => {
    const { service, repository } = build({
      current: { id: 5, user_id: OWNER, slug: SLUG, is_highlight: true, is_active: true },
      highlightCount: MAX_HIGHLIGHT_SERVICES,
      updated: { id: 5, is_highlight: false, is_active: true },
    });
    await service.updateStatus(5, { is_highlight: false } as never);
    expect(repository.countHighlights).not.toHaveBeenCalled();
  });

  it("AC-14: another user's service -> 400 'Service not found', no write, one critical with step ownership", async () => {
    const { service, repository, emitter, lines } = build({
      current: { id: 5, user_id: 999, slug: SLUG, is_highlight: false, is_active: true },
    });

    const attempt = service.updateStatus(5, { is_active: false } as never);
    await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
    await expect(attempt).rejects.toThrow('Service not found');

    expect(repository.updateStatus).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
    const critical = criticals(lines);
    expect(critical.length).toBeGreaterThanOrEqual(1);
    const own = critical.filter((l) => l.operation === 'service-status-update');
    expect(own).toHaveLength(1);
    expect(own[0].message).toBe('Service status update targeted a foreign service');
    expect(own[0].extraInfo).toEqual(
      expect.objectContaining({ step: 'ownership', user_id: OWNER, service_id: 5 }),
    );
    expect(JSON.stringify(lines)).not.toContain('999');
  });

  it('AC-14: a non-existent id -> the same 400 and NO critical line', async () => {
    const { service, repository, lines } = build({ current: null });
    const attempt = service.updateStatus(404, { is_active: false } as never);
    await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
    await expect(attempt).rejects.toThrow('Service not found');
    expect(repository.updateStatus).not.toHaveBeenCalled();
    expect(criticals(lines)).toHaveLength(0);
  });

  it('AC-15: is_highlight changed -> allByUser, bySlug, highlightCount cleared; SEO cache NOT; one purge', async () => {
    const { service, helpers, emitter } = build({ updated: { id: 5, is_highlight: true, is_active: true } });
    await service.updateStatus(5, { is_highlight: true } as never);

    expect(deletedKeys(helpers).sort()).toEqual(
      [
        serviceCacheKeys.allByUser(OWNER),
        serviceCacheKeys.bySlug(OWNER, SLUG),
        serviceCacheKeys.highlightCount(OWNER),
      ].sort(),
    );
    expect(helpers.deleteCached).not.toHaveBeenCalledWith(CACHE_KEY_SERVICE_SEO(OWNER, SLUG), expect.anything());
    expect(purges(emitter)).toHaveLength(1);
    expect(purges(emitter)[0][1]).toBeInstanceOf(ArtistPublicPagesChangedEvent);
    expect(purges(emitter)[0][1]).toEqual(expect.objectContaining({ userId: OWNER }));
  });

  it('AC-15: is_active changed -> allByUser, bySlug and SEO (all languages) cleared; highlightCount NOT; one purge', async () => {
    const { service, helpers, emitter } = build({ updated: { id: 5, is_highlight: false, is_active: false } });
    await service.updateStatus(5, { is_active: false } as never);

    expect(helpers.deleteManyCached).toHaveBeenCalledWith([
      serviceCacheKeys.allByUser(OWNER),
      serviceCacheKeys.bySlug(OWNER, SLUG),
    ]);
    expect(helpers.deleteCached).toHaveBeenCalledTimes(1);
    expect(helpers.deleteCached).toHaveBeenCalledWith(CACHE_KEY_SERVICE_SEO(OWNER, SLUG), {
      appended_language: true,
    });
    expect(deletedKeys(helpers)).not.toContain(serviceCacheKeys.highlightCount(OWNER));
    expect(purges(emitter)).toHaveLength(1);
  });

  it('AC-15: both fields -> all four cache entries cleared and a single purge', async () => {
    const { service, helpers, emitter } = build({ updated: { id: 5, is_highlight: true, is_active: false } });
    await service.updateStatus(5, { is_highlight: true, is_active: false } as never);

    expect(deletedKeys(helpers)).toEqual(
      expect.arrayContaining([
        serviceCacheKeys.allByUser(OWNER),
        serviceCacheKeys.bySlug(OWNER, SLUG),
        serviceCacheKeys.highlightCount(OWNER),
        CACHE_KEY_SERVICE_SEO(OWNER, SLUG),
      ]),
    );
    expect(deletedKeys(helpers)).toHaveLength(4);
    expect(helpers.deleteCached).toHaveBeenCalledWith(CACHE_KEY_SERVICE_SEO(OWNER, SLUG), {
      appended_language: true,
    });
    expect(purges(emitter)).toHaveLength(1);
  });

  it('AC-15: caches are cleared and the purge emitted only after the write', async () => {
    const { service, repository, helpers, emitter } = build({ updated: { id: 5, is_highlight: false, is_active: false } });
    await service.updateStatus(5, { is_active: false } as never);
    const write = repository.updateStatus.mock.invocationCallOrder[0];
    expect(helpers.deleteManyCached.mock.invocationCallOrder[0]).toBeGreaterThan(write);
    expect(emitter.emit.mock.invocationCallOrder[0]).toBeGreaterThan(
      helpers.deleteManyCached.mock.invocationCallOrder[0],
    );
  });

  it('AC-15: a no-op (repository returns null) returns the current values with no cache delete and no emit', async () => {
    const { service, helpers, emitter, lines } = build({
      current: { id: 5, user_id: OWNER, slug: SLUG, is_highlight: false, is_active: true },
      updated: null,
    });
    await expect(service.updateStatus(5, { is_active: true } as never)).resolves.toEqual({
      id: 5,
      is_highlight: false,
      is_active: true,
    });
    expect(deletedKeys(helpers)).toHaveLength(0);
    expect(emitter.emit).not.toHaveBeenCalled();
    const done = lines.find((l) => l.message === 'Service status updated');
    expect(done?.extraInfo).toEqual(expect.objectContaining({ changed: false }));
  });

  it('AC-15/logging: started line lists sent field names only; success carries ids and changed', async () => {
    const { service, lines } = build({ updated: { id: 5, is_highlight: true, is_active: false } });
    await service.updateStatus(5, { is_highlight: true, is_active: false } as never);

    const flow = lines.filter((l) => l.operation === 'service-status-update');
    const started = flow.find((l) => l.message === 'Service status update started');
    const done = flow.find((l) => l.message === 'Service status updated');
    expect(started.channel ?? done.channel).toBe('services');
    expect(started.extraInfo).toEqual(expect.objectContaining({ user_id: OWNER, service_id: 5 }));
    expect(String(started.extraInfo.fields)).toContain('is_highlight');
    expect(String(started.extraInfo.fields)).toContain('is_active');
    expect(done.extraInfo).toEqual(
      expect.objectContaining({ user_id: OWNER, service_id: 5, is_highlight: true, is_active: false, changed: true }),
    );
    expect(criticals(lines)).toHaveLength(0);
  });
});
