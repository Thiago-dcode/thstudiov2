import type { Cache } from '@nestjs/cache-manager';
import type { CompressService } from '@repo/backend-lib/services/compress-service/base';
import type { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { Helpers } from './helpers.service';
import type { RequestService } from './request.service';

const build = () => {
  const store = new Map<string, unknown>();
  const cache = {
    get: jest.fn(async (key: string) => store.get(key)),
    set: jest.fn(async (key: string, value: unknown) => { store.set(key, value); }),
  } as unknown as Cache;
  const helpers = new Helpers(
    { language: 'EN' } as unknown as RequestService,
    {} as StorageService,
    {} as CompressService,
    cache,
  );
  return { helpers, cache };
};

describe('Helpers.cacheRemember', () => {
  it('runs the producer once for concurrent misses on the same key', async () => {
    const { helpers, cache } = build();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const producer = jest.fn(async () => {
      await gate;
      return { id: 1 };
    });

    const calls = Array.from({ length: 5 }, () => helpers.cacheRemember('k', producer, { ttl: 1000 }));
    release();
    const results = await Promise.all(calls);

    expect(producer).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array(5).fill({ id: 1 }));
    // Each caller gets its own copy, as it would from a cache hit.
    expect(results[0]).not.toBe(results[1]);
  });

  it('lets the next miss retry after the producer fails', async () => {
    const { helpers } = build();
    const failing = jest.fn().mockRejectedValue(new Error('db down'));
    await expect(helpers.cacheRemember('k', failing, { ttl: 1000 })).rejects.toThrow('db down');

    await expect(helpers.cacheRemember('k', async () => 'ok', { ttl: 1000 })).resolves.toBe('ok');
  });

  it('serves a hit without running the producer', async () => {
    const { helpers } = build();
    await helpers.cacheRemember('k', async () => null, { ttl: 1000 });
    const producer = jest.fn();

    await expect(helpers.cacheRemember('k', producer, { ttl: 1000 })).resolves.toBeNull();
    expect(producer).not.toHaveBeenCalled();
  });
});
