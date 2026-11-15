import { WorkerHost } from '@nestjs/bullmq';
import { withTimeout } from '@repo/backend-lib/utils';

export type ConsumerStatus = { queue: string; ok: boolean; reason?: string };

/**
 * Upper bound for awaiting one worker's Redis client. The getter resolves once the connection is
 * ready, so a connection that never comes back would otherwise hang the whole check.
 */
const CLIENT_TIMEOUT_MS = 2000;

/** BullMQ's ioredis-style client exposes its connection state as a string (`ready`, `reconnecting`, `end`, ...). */
const clientStatus = async (client: Promise<{ status: string }>, label: string): Promise<string> =>
  (await withTimeout(client, CLIENT_TIMEOUT_MS, label)).status;

/**
 * Whether one `@Processor` consumer is actually able to pull jobs: created, running, not paused,
 * and both of its Redis connections (commands and the blocking `waitForJob` one) ready.
 * Never throws: any error becomes a failing status with the reason.
 */
export async function inspectWorker(host: WorkerHost): Promise<ConsumerStatus> {
  let queue = host.constructor?.name ?? 'unknown';
  try {
    // Throws "Worker has not yet been initialized" until the BullMQ explorer created it.
    const worker = host.worker;
    queue = worker.name;
    if (!worker.isRunning()) return { queue, ok: false, reason: 'worker is not running' };
    if (worker.isPaused()) return { queue, ok: false, reason: 'worker is paused' };

    const status = await clientStatus(worker.backend.client, `${queue} redis client`);
    if (status !== 'ready') return { queue, ok: false, reason: `redis client is "${status}"` };

    const blockingClient = worker.backend.blockingClient;
    if (blockingClient) {
      const blockingStatus = await clientStatus(blockingClient, `${queue} blocking redis client`);
      if (blockingStatus !== 'ready') {
        return { queue, ok: false, reason: `blocking redis client is "${blockingStatus}"` };
      }
    }
    return { queue, ok: true };
  } catch (error) {
    return { queue, ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/** Only the failing consumers, so callers can log them and decide on `length`. */
export async function failingConsumers(hosts: readonly WorkerHost[]): Promise<ConsumerStatus[]> {
  const statuses = await Promise.all(hosts.map((host) => inspectWorker(host)));
  return statuses.filter((status) => !status.ok);
}
