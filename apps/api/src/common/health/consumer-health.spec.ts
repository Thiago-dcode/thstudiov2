import { WorkerHost } from '@nestjs/bullmq';
import { failingConsumers, inspectWorker } from './consumer-health';

type FakeOpts = {
  name?: string;
  running?: boolean;
  paused?: boolean;
  clientStatus?: string;
  blockingStatus?: string | null; // null = no blocking client
  clientHangs?: boolean;
  uninitialized?: boolean;
};

class FakeHost extends WorkerHost {
  async process(): Promise<void> {
    return undefined;
  }
}

const makeHost = ({
  name = 'stripe-webhooks',
  running = true,
  paused = false,
  clientStatus = 'ready',
  blockingStatus = 'ready',
  clientHangs = false,
  uninitialized = false,
}: FakeOpts = {}): WorkerHost => {
  const host = new FakeHost();
  if (uninitialized) return host;
  const worker = {
    name,
    isRunning: () => running,
    isPaused: () => paused,
    backend: {
      client: clientHangs ? new Promise(() => undefined) : Promise.resolve({ status: clientStatus }),
      blockingClient: blockingStatus === null ? undefined : Promise.resolve({ status: blockingStatus }),
    },
  };
  Object.defineProperty(host, '_worker', { value: worker });
  return host;
};

describe('inspectWorker', () => {
  it('AC-2: passes a running, unpaused worker with both clients ready', async () => {
    await expect(inspectWorker(makeHost())).resolves.toEqual({ queue: 'stripe-webhooks', ok: true });
  });

  it('AC-2: passes when there is no blocking client', async () => {
    await expect(inspectWorker(makeHost({ blockingStatus: null }))).resolves.toMatchObject({ ok: true });
  });

  it('AC-2: fails an uninitialized worker without throwing', async () => {
    const result = await inspectWorker(makeHost({ uninitialized: true }));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not yet been initialized/);
  });

  it('AC-2: fails a worker that is not running', async () => {
    const result = await inspectWorker(makeHost({ running: false }));
    expect(result).toMatchObject({ queue: 'stripe-webhooks', ok: false });
    expect(result.reason).toMatch(/not running/);
  });

  it('AC-2: fails a paused worker', async () => {
    const result = await inspectWorker(makeHost({ paused: true }));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/paused/);
  });

  it('AC-2: fails when the command client is reconnecting', async () => {
    const result = await inspectWorker(makeHost({ clientStatus: 'reconnecting' }));
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('reconnecting');
  });

  it('AC-2: fails when the blocking client has ended', async () => {
    const result = await inspectWorker(makeHost({ blockingStatus: 'end' }));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/blocking/);
    expect(result.reason).toContain('end');
  });

  it('AC-2: fails (does not hang) when the redis client never resolves', async () => {
    jest.useFakeTimers();
    try {
      const pending = inspectWorker(makeHost({ clientHangs: true }));
      await jest.advanceTimersByTimeAsync(5000);
      const result = await pending;
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/timed out/);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('failingConsumers', () => {
  it('AC-2: returns only the failing consumers with their queue names', async () => {
    const failing = await failingConsumers([
      makeHost({ name: 'mail' }),
      makeHost({ name: 'plan-subscriptions', running: false }),
      makeHost({ name: 'stripe-webhooks', paused: true }),
    ]);
    expect(failing.map((f) => f.queue).sort()).toEqual(['plan-subscriptions', 'stripe-webhooks']);
  });

  it('AC-2: returns an empty list when all pass', async () => {
    await expect(failingConsumers([makeHost(), makeHost({ name: 'mail' })])).resolves.toEqual([]);
  });
});
