jest.mock('src/common/utils/user-lock', () => ({
  ENTITY_CREATE_LOCK_TTL_MS: 1000,
  withUserLock: (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
}));
// The ownership lookup is the DB boundary of this flow.
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
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from '@repo/common-lib/constants/events';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { consoleRequestService } from 'src/common/testing/console-logger';
import { classifyOwnedIds } from 'src/common/utils/owned-ids.util';
import { ArtistPublicPagesChangedEvent } from '../edge-cache/events/artist-public-pages-changed.event';
import { CollectionService } from './collection.service';

const OWNER = 7;
const classify = classifyOwnedIds as jest.MockedFunction<typeof classifyOwnedIds>;

const build = (updatedCount = 2) => {
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
  const emitter = { emit: jest.fn() };
  const repository = { updatePositions: jest.fn().mockResolvedValue(updatedCount) };
  const requestService = consoleRequestService();
  Object.defineProperty(requestService, 'user', { value: { id: OWNER }, configurable: true });
  const service = new CollectionService(
    repository as never,
    requestService,
    {} as never,
    {} as never,
    {} as never,
    emitter as never,
  );
  return { service, repository, emitter, lines };
};

const request = (...pairs: [number, number][]) =>
  ({ items: pairs.map(([module_id, position]) => ({ module_id, position })) }) as never;
const criticals = (lines: any[]) => lines.filter((l) => String(l.level).toUpperCase() === 'CRITICAL');

describe('CollectionService.updatePositions', () => {
  beforeEach(() => {
    classify.mockReset();
    classify.mockResolvedValue({ missing: [], foreign: [] });
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-1: returns { updated_count } from the repository and writes for the caller only', async () => {
    const { service, repository } = build(2);
    const body = request([11, 0], [12, 1], [13, 2]);

    await expect(service.updatePositions(body)).resolves.toEqual({ updated_count: 2 });

    expect(classify).toHaveBeenCalledWith(TABLES_ENUM.COLLECTIONS, [11, 12, 13], OWNER);
    expect(repository.updatePositions).toHaveBeenCalledTimes(1);
    expect(repository.updatePositions).toHaveBeenCalledWith(OWNER, (body as any).items);
  });

  it('AC-1: logs started and completed lines on channel collections with counts only', async () => {
    const { service, lines } = build(1);
    await service.updatePositions(request([11, 0], [12, 1]));

    const flow = lines.filter((l) => l.operation === 'collection-reorder');
    const started = flow.find((l) => l.message === 'Collection reorder started');
    const done = flow.find((l) => l.message === 'Collection reorder completed');
    expect(started?.extraInfo).toEqual(expect.objectContaining({ user_id: OWNER, item_count: 2 }));
    expect(done?.extraInfo).toEqual(
      expect.objectContaining({ user_id: OWNER, item_count: 2, updated_count: 1 }),
    );
    expect(started.channel ?? done.channel).toBe('collections');
    expect(criticals(flow)).toHaveLength(0);
  });

  it('AC-2: a foreign id -> 400 "Collection not found", no write, no emit', async () => {
    classify.mockResolvedValue({ missing: [], foreign: [12] });
    const { service, repository, emitter } = build();

    const attempt = service.updatePositions(request([11, 0], [12, 1]));
    await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
    await expect(attempt).rejects.toThrow('Collection not found');

    expect(repository.updatePositions).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('AC-2: a foreign id logs exactly one critical (step, user_id, item_count, foreign_count) and leaks no foreign ids', async () => {
    classify.mockResolvedValue({ missing: [], foreign: [912345, 912346] });
    const { service, lines } = build();

    await expect(service.updatePositions(request([11, 0], [912345, 1], [912346, 2]))).rejects.toThrow();

    const critical = criticals(lines);
    expect(critical).toHaveLength(1);
    expect(critical[0].operation).toBe('collection-reorder');
    expect(critical[0].extraInfo).toEqual(
      expect.objectContaining({ step: 'ownership', user_id: OWNER, item_count: 3, foreign_count: 2 }),
    );
    expect(JSON.stringify(lines)).not.toContain('912345');
    expect(JSON.stringify(lines)).not.toContain('912346');
    expect(lines.some((l) => l.message === 'Collection reorder completed')).toBe(false);
  });

  it('AC-3: a missing id -> 400 "Collection not found", no write, no emit and NO critical', async () => {
    classify.mockResolvedValue({ missing: [999], foreign: [] });
    const { service, repository, emitter, lines } = build();

    const attempt = service.updatePositions(request([11, 0], [999, 1]));
    await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
    await expect(attempt).rejects.toThrow('Collection not found');

    expect(repository.updatePositions).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
    expect(criticals(lines)).toHaveLength(0);
  });

  it('AC-7: emits ARTIST_PUBLIC_PAGES_CHANGED_EVENT once for the caller, after the write', async () => {
    const { service, repository, emitter } = build(3);
    await service.updatePositions(request([11, 0], [12, 1], [13, 2]));

    const purges = emitter.emit.mock.calls.filter(([name]) => name === ARTIST_PUBLIC_PAGES_CHANGED_EVENT);
    expect(purges).toHaveLength(1);
    expect(purges[0][1]).toBeInstanceOf(ArtistPublicPagesChangedEvent);
    expect(purges[0][1]).toEqual(expect.objectContaining({ userId: OWNER }));
    expect(emitter.emit.mock.invocationCallOrder[0]).toBeGreaterThan(
      repository.updatePositions.mock.invocationCallOrder[0],
    );
  });

  it('AC-7: a no-op (updated_count 0) emits nothing and returns { updated_count: 0 }', async () => {
    const { service, emitter } = build(0);
    await expect(service.updatePositions(request([11, 0]))).resolves.toEqual({ updated_count: 0 });
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
