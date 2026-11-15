import * as barrel from './index';
import { withTimeout } from './with-timeout';

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('AC-21: resolves with the probe value when it settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000, 'probe')).resolves.toBe(42);
  });

  it('AC-21: propagates the probe rejection unchanged', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000, 'probe')).rejects.toThrow('boom');
  });

  it('AC-21: rejects with the label and duration when the probe hangs', async () => {
    const pending = withTimeout(new Promise<never>(() => undefined), 3000, 'redis');
    const assertion = expect(pending).rejects.toThrow('redis timed out after 3000ms');
    await jest.advanceTimersByTimeAsync(3000);
    await assertion;
  });

  it('AC-21: does not reject before the deadline', async () => {
    let settled = false;
    const pending = withTimeout(new Promise<never>(() => undefined), 3000, 'x').catch(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(2999);
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });

  it('AC-21: clears its timer after success and after failure', async () => {
    await withTimeout(Promise.resolve(1), 1000, 'ok');
    expect(jest.getTimerCount()).toBe(0);
    await withTimeout(Promise.reject(new Error('x')), 1000, 'bad').catch(() => undefined);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('AC-21: is exported from the utils barrel', () => {
    expect(barrel.withTimeout).toBe(withTimeout);
  });
});
