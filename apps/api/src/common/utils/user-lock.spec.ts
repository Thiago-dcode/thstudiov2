const store = new Map<string, string>();
let failSet = false;

jest.mock('redis', () => ({
  createClient: () => ({
    on: jest.fn(),
    connect: jest.fn(async () => undefined),
    set: jest.fn(async (key: string, value: string, opts: { condition?: string }) => {
      if (failSet) throw new Error('redis down');
      if (opts.condition === 'NX' && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    }),
    // The release script: delete only when the stored token matches.
    eval: jest.fn(async (_script: string, opts: { keys: string[]; arguments: string[] }) => {
      const [key] = opts.keys;
      if (store.get(key) !== opts.arguments[0]) return 0;
      store.delete(key);
      return 1;
    }),
  }),
}));

jest.mock('@repo/common-lib/config/utils', () => ({
  getConfigValue: () => ({ url: 'redis://test' }),
}));

import { ConflictException } from '@nestjs/common';
import { withUserLock } from './user-lock';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

describe('withUserLock', () => {
  beforeEach(() => {
    store.clear();
    failSet = false;
  });

  it('rejects a second caller while the first still holds the lock', async () => {
    const gate = deferred();
    const first = withUserLock('create:collections:7', 1000, async () => {
      await gate.promise;
      return 'first';
    });
    // Let the first caller take the lock.
    await new Promise((r) => setImmediate(r));

    await expect(withUserLock('create:collections:7', 1000, async () => 'second')).rejects.toBeInstanceOf(
      ConflictException,
    );

    gate.resolve();
    await expect(first).resolves.toBe('first');
  });

  it('releases the lock after success and after failure', async () => {
    await withUserLock('k', 1000, async () => 'ok');
    expect(store.size).toBe(0);

    await expect(
      withUserLock('k', 1000, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(store.size).toBe(0);
  });

  it('does not delete a lock another caller re-took after this one expired', async () => {
    await withUserLock('k', 1000, async () => {
      store.set('user-lock:k', 'someone-else');
    });
    expect(store.get('user-lock:k')).toBe('someone-else');
  });

  it('keeps users independent', async () => {
    const gate = deferred();
    const first = withUserLock('create:collections:1', 1000, () => gate.promise);
    await new Promise((r) => setImmediate(r));
    await expect(withUserLock('create:collections:2', 1000, async () => 'other user')).resolves.toBe(
      'other user',
    );
    gate.resolve();
    await first;
  });

  it('fails open when Redis errors', async () => {
    failSet = true;
    await expect(withUserLock('k', 1000, async () => 'ran')).resolves.toBe('ran');
  });

  it('with waitMs, waits for the holder to finish instead of returning a 409', async () => {
    const gate = deferred();
    const order: string[] = [];
    const first = withUserLock('wait', 10_000, async () => {
      await gate.promise;
      order.push('first');
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = withUserLock('wait', 10_000, async () => {
      order.push('second');
    }, { waitMs: 2_000 });
    setTimeout(() => gate.resolve(), 120);
    await Promise.all([first, second]);
    expect(order).toEqual(['first', 'second']);
  });

  it('with waitMs, still returns a 409 once the wait runs out', async () => {
    const gate = deferred();
    const first = withUserLock('timeout', 10_000, () => gate.promise);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await expect(
      withUserLock('timeout', 10_000, async () => undefined, { waitMs: 150 }),
    ).rejects.toBeInstanceOf(ConflictException);
    gate.resolve();
    await first;
  });
});
