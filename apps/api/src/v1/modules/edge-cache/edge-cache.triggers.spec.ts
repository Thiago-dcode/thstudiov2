// Same reasons as the collection slug specs: no Redis lock, no real DB ownership query.
jest.mock('src/common/utils/user-lock', () => ({
  ENTITY_CREATE_LOCK_TTL_MS: 1000,
  withUserLock: (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
}));
jest.mock('src/common/utils/owned-ids.util', () => ({
  assertOwnedIds: jest.fn().mockResolvedValue(undefined),
}));
// `media.service` imports `users.service`, which builds a Stripe client at import time.
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'uuid'),
}));

import { QueueHelper } from '@repo/backend-lib/utils';
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from '@repo/common-lib/constants/events';
import { AboutPageService } from '../about-page/about-page.service';
import { AddressService } from '../addresses/address.service';
import { CollectionService } from '../collections/collection.service';
import { MediaService } from '../media/media.service';
import { PortfolioService } from '../portfolios/portfolio.service';
import { ServiceService } from '../services/service.service';
import { ArtistPublicPagesChangedEvent } from './events/artist-public-pages-changed.event';

/**
 * The write paths that change what an artist's public pages render emit
 * `ARTIST_PUBLIC_PAGES_CHANGED_EVENT` with the owner's id, after the write (AC-13, AC-16).
 */
const OWNER = 7;

const buildEmitter = () => ({ emit: jest.fn() });

const purgeCalls = (emitter: ReturnType<typeof buildEmitter>) =>
  emitter.emit.mock.calls.filter(([name]) => name === ARTIST_PUBLIC_PAGES_CHANGED_EVENT);

const expectPurgeFor = (emitter: ReturnType<typeof buildEmitter>, userId: number, times = 1) => {
  const calls = purgeCalls(emitter);
  expect(calls).toHaveLength(times);
  for (const [, event] of calls) {
    expect(event).toBeInstanceOf(ArtistPublicPagesChangedEvent);
    expect(event).toEqual(expect.objectContaining({ userId }));
  }
};

/** Index of the first purge emit in the global call order, to compare with the write. */
const purgeOrder = (emitter: ReturnType<typeof buildEmitter>) => {
  const index = emitter.emit.mock.calls.findIndex(([name]) => name === ARTIST_PUBLIC_PAGES_CHANGED_EVENT);
  return emitter.emit.mock.invocationCallOrder[index];
};

const helpers = () => ({
  deleteCached: jest.fn().mockResolvedValue(undefined),
  deleteManyCached: jest.fn().mockResolvedValue(undefined),
  deleteAsset: jest.fn().mockResolvedValue(undefined),
  deleteDirectory: jest.fn().mockResolvedValue(undefined),
  getAsset: jest.fn(async (path: string) => path),
  cacheRemember: jest.fn(),
});

describe('edge purge triggers', () => {
  beforeEach(() => {
    for (const method of [
      'createComputeUserMetricsJob',
      'createGenerateSingleEntityMetadataJob',
      'createOrUpdateUserNotificationJob',
      'createOrUpdateLocationJob',
      'createSetVideoThumbnailJob',
      'createPurgeArtistEdgeCacheJob',
    ] as const) {
      jest.spyOn(QueueHelper, method).mockResolvedValue(undefined);
    }
  });

  afterEach(() => jest.restoreAllMocks());

  describe('CollectionService', () => {
    const build = () => {
      const emitter = buildEmitter();
      const repository = {
        slugExists: jest.fn().mockResolvedValue(false),
        titleExists: jest.fn().mockResolvedValue(false),
        create: jest.fn(async (input) => ({ id: 42, ...input })),
        updateById: jest.fn(async (id, input) => ({ id, ...input })),
        getOneCompact: jest
          .fn()
          .mockResolvedValue({ id: 42, user_id: OWNER, slug: 'work', is_highlight: false }),
        countHighlights: jest.fn().mockResolvedValue(0),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      const service = new CollectionService(
        repository as never,
        { user: { id: OWNER } } as never,
        { enforceEntityLimit: jest.fn() } as never,
        helpers() as never,
        {} as never,
        emitter as never,
      );
      return { service, repository, emitter };
    };
    const media = [{ id: 1, position: 1 }];

    it('create', async () => {
      const { service, repository, emitter } = build();
      await service.create({ title: 'Work', user_id: OWNER, media } as never);
      expectPurgeFor(emitter, OWNER);
      expect(purgeOrder(emitter)).toBeGreaterThan(repository.create.mock.invocationCallOrder[0]);
    });

    it('update', async () => {
      const { service, repository, emitter } = build();
      await service.update(42, { title: 'Work 2', media } as never);
      expectPurgeFor(emitter, OWNER);
      expect(purgeOrder(emitter)).toBeGreaterThan(repository.updateById.mock.invocationCallOrder[0]);
    });

    it('delete', async () => {
      const { service, repository, emitter } = build();
      await service.delete(42);
      expectPurgeFor(emitter, OWNER);
      expect(purgeOrder(emitter)).toBeGreaterThan(repository.delete.mock.invocationCallOrder[0]);
    });

    it('not on a refused update', async () => {
      const { service, emitter } = build();
      await expect(service.update(42, { title: 'x', media: [] } as never)).rejects.toThrow();
      expect(purgeCalls(emitter)).toHaveLength(0);
    });
  });

  describe('PortfolioService', () => {
    it('delete', async () => {
      const emitter = buildEmitter();
      const repository = {
        getOneCompact: jest.fn().mockResolvedValue({ id: 3, user_id: OWNER, thumbnail: null }),
        delete: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(false),
      };
      const service = new PortfolioService(
        repository as never,
        { user: { id: OWNER } } as never,
        {} as never,
        emitter as never,
        helpers() as never,
        {} as never,
        {} as never,
        {} as never,
      );

      await service.delete(3);

      expectPurgeFor(emitter, OWNER);
      expect(purgeOrder(emitter)).toBeGreaterThan(repository.delete.mock.invocationCallOrder[0]);
    });
  });

  describe('ServiceService', () => {
    it('update', async () => {
      const emitter = buildEmitter();
      const repository = {
        getOneCompact: jest
          .fn()
          .mockResolvedValue({ id: 5, user_id: OWNER, slug: 'shoot', is_highlight: false }),
        titleExists: jest.fn().mockResolvedValue(false),
        countHighlights: jest.fn().mockResolvedValue(0),
        updateById: jest.fn(async (id, input) => ({ id, ...input })),
      };
      const service = new ServiceService(
        repository as never,
        { user: { id: OWNER } } as never,
        {} as never,
        helpers() as never,
        {} as never,
        emitter as never,
      );

      await service.update(5, { title: 'Shoot' } as never);

      expectPurgeFor(emitter, OWNER);
      expect(purgeOrder(emitter)).toBeGreaterThan(repository.updateById.mock.invocationCallOrder[0]);
    });
  });

  describe('AboutPageService', () => {
    it('update', async () => {
      const emitter = buildEmitter();
      const repository = {
        getOneById: jest.fn().mockResolvedValue({ id: 9, user_id: OWNER, photo: null }),
        updateAndGet: jest.fn(async (id, data) => ({ id, ...data })),
      };
      const service = new AboutPageService(
        repository as never,
        helpers() as never,
        {} as never,
        { user: { id: OWNER } } as never,
        emitter as never,
      );

      await service.update(9, { content: 'Hi' } as never);

      expectPurgeFor(emitter, OWNER);
    });
  });

  describe('AddressService', () => {
    const build = (address: { user_id: number | null; client_id: number | null }) => {
      const emitter = buildEmitter();
      const before = { id: 1, city: 'Madrid', state: null, country: null, ...address };
      const repository = {
        getOneById: jest.fn().mockResolvedValue(before),
        updateAndGet: jest.fn(async (_id, patch) => ({ ...before, ...patch })),
      };
      const service = new AddressService(
        repository as never,
        { user: { id: OWNER } } as never,
        emitter as never,
      );
      return { service, emitter };
    };

    it("update of an artist's address", async () => {
      const { service, emitter } = build({ user_id: OWNER, client_id: null });
      // Same locality: no SEO stamp write (that would reach the database).
      await service.update(1, { formated_address: 'Gran Vía 1' } as never);
      expectPurgeFor(emitter, OWNER);
    });
  });

  describe('MediaService', () => {
    const build = () => {
      const emitter = buildEmitter();
      const rows = [
        { id: 1, user_id: OWNER, public_id: 'p1', blocked_at: null },
        { id: 2, user_id: OWNER, public_id: 'p2', blocked_at: null },
      ];
      const repository = {
        findById: jest.fn(async (id: number) => rows.find((row) => row.id === id)),
        findManyByIds: jest.fn().mockResolvedValue(rows),
        deleteById: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(true),
        updateById: jest.fn(async (id, data) => ({ id, ...data })),
      };
      const service = new MediaService(
        repository as never,
        {} as never,
        { user: { id: OWNER, public_id: 'owner' } } as never,
        { deleteDirectory: jest.fn().mockResolvedValue(true) } as never,
        helpers() as never,
        emitter as never,
        {} as never,
        {} as never,
      );
      return { service, repository, emitter };
    };

    it('delete', async () => {
      const { service, emitter } = build();
      await service.delete(1);
      expectPurgeFor(emitter, OWNER);
    });

    it('deleteMany purges the owner once, not once per media', async () => {
      const { service, emitter } = build();
      await expect(service.deleteMany({ media: [1, 2] } as never)).resolves.toEqual({
        deleted: [1, 2],
        errors: [],
      });
      expectPurgeFor(emitter, OWNER, 1);
    });

    it('update', async () => {
      const { service, repository, emitter } = build();
      await service.update(1, { title: 'New title' } as never);
      expectPurgeFor(emitter, OWNER);
      expect(purgeOrder(emitter)).toBeGreaterThan(repository.updateById.mock.invocationCallOrder[0]);
    });
  });
});
