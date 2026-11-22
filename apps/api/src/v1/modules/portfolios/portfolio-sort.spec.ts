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
import { PortfolioService } from './portfolio.service';

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
  const service = new PortfolioService(
    repository as never,
    requestService,
    {} as never,
    emitter as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, repository, emitter, lines };
};

const request = (...pairs: [number, number][]) =>
  ({ items: pairs.map(([module_id, position]) => ({ module_id, position })) }) as never;

describe('PortfolioService.updatePositions', () => {
  beforeEach(() => {
    classify.mockReset();
    classify.mockResolvedValue({ missing: [], foreign: [] });
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-1: returns { updated_count } from the repository and writes for the caller only', async () => {
    const { service, repository } = build(2);
    const body = request([11, 0], [12, 1], [13, 2]);

    await expect(service.updatePositions(body)).resolves.toEqual({ updated_count: 2 });

    expect(classify).toHaveBeenCalledWith(TABLES_ENUM.PORTFOLIOS, [11, 12, 13], OWNER);
    expect(repository.updatePositions).toHaveBeenCalledTimes(1);
    expect(repository.updatePositions).toHaveBeenCalledWith(OWNER, (body as any).items);
  });

  it('AC-1/AC-logging: logs a started and a completed line with ids and counts only', async () => {
    const { service, lines } = build(1);
    await service.updatePositions(request([11, 0], [12, 1]));

    const reorder = lines.filter((l) => l.operation === 'portfolio-reorder');
    const started = reorder.find((l) => l.message === 'Portfolio reorder started');
    const done = reorder.find((l) => l.message === 'Portfolio reorder completed');
    expect(started?.extraInfo).toEqual(expect.objectContaining({ user_id: OWNER, item_count: 2 }));
    expect(done?.extraInfo).toEqual(
      expect.objectContaining({ user_id: OWNER, item_count: 2, updated_count: 1 }),
    );
    expect(started.channel ?? done.channel).toBe('portfolios');
    expect(reorder.some((l) => String(l.level).toUpperCase() === 'CRITICAL')).toBe(false);
  });

  it('AC-2: a foreign id -> 400 "Portfolio not found", no write, no emit', async () => {
    classify.mockResolvedValue({ missing: [], foreign: [12] });
    const { service, repository, emitter } = build();

    const attempt = service.updatePositions(request([11, 0], [12, 1]));
    await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
    await expect(attempt).rejects.toThrow('Portfolio not found');

    expect(repository.updatePositions).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('AC-2: a foreign id logs exactly one critical with step, user_id, item_count, foreign_count and no other owner data', async () => {
    classify.mockResolvedValue({ missing: [], foreign: [912345, 912346] });
    const { service, lines } = build();

    await expect(service.updatePositions(request([11, 0], [912345, 1], [912346, 2]))).rejects.toThrow();

    const critical = lines.filter((l) => String(l.level).toUpperCase() === 'CRITICAL');
    expect(critical).toHaveLength(1);
    expect(critical[0].operation).toBe('portfolio-reorder');
    expect(critical[0].extraInfo).toEqual(
      expect.objectContaining({ step: 'ownership', user_id: OWNER, item_count: 3, foreign_count: 2 }),
    );
    // The foreign ids must not leak into any line.
    expect(JSON.stringify(lines)).not.toContain('912345');
    expect(JSON.stringify(lines)).not.toContain('912346');
    // No completed line for a refused request.
    expect(lines.some((l) => l.message === 'Portfolio reorder completed')).toBe(false);
  });

  it('AC-3: a missing id -> 400 "Portfolio not found", no write, and NO critical line', async () => {
    classify.mockResolvedValue({ missing: [999], foreign: [] });
    const { service, repository, emitter, lines } = build();

    const attempt = service.updatePositions(request([11, 0], [999, 1]));
    await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
    await expect(attempt).rejects.toThrow('Portfolio not found');

    expect(repository.updatePositions).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
    expect(lines.filter((l) => String(l.level).toUpperCase() === 'CRITICAL')).toHaveLength(0);
  });

  it('AC-3: missing and foreign together still answers 400 and logs the critical (foreign wins)', async () => {
    classify.mockResolvedValue({ missing: [999], foreign: [12] });
    const { service, lines } = build();
    await expect(service.updatePositions(request([12, 0], [999, 1]))).rejects.toThrow('Portfolio not found');
    expect(lines.filter((l) => String(l.level).toUpperCase() === 'CRITICAL')).toHaveLength(1);
  });

  it('AC-8: emits ARTIST_PUBLIC_PAGES_CHANGED_EVENT once for the caller, after the write, when something changed', async () => {
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

  it('AC-8: a no-op (updated_count 0) emits nothing and still returns { updated_count: 0 }', async () => {
    const { service, emitter } = build(0);
    await expect(service.updatePositions(request([11, 0]))).resolves.toEqual({ updated_count: 0 });
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
