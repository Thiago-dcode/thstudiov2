import { WorkerHost } from '@nestjs/bullmq';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { createApiLogger } from '../utils/api-logger';
import { withTimeout } from '@repo/backend-lib/utils';
import { getClient } from '@repo/database';
import { getLockClient } from '../utils/cron-lock';
import { ConsumerStatus, failingConsumers } from './consumer-health';

/** Upper bound for each dependency probe, so a hung connection fails the check instead of stalling it. */
export const HEALTH_CHECK_TIMEOUT_MS = 3000;

/** A `PING` round trip: `status` alone stays `ready` while a frozen Redis keeps the socket open. */
async function pingLockClient(): Promise<void> {
  const client = await getLockClient();
  if (!client) throw new Error('redis client unavailable');
  await client.ping();
}

export type HealthCheck = 'ok' | 'fail';
export type ApiHealthChecks = Record<'redis' | 'database' | 'workers', HealthCheck>;
export type ApiHealthResult = { healthy: boolean; checks: ApiHealthChecks };

/**
 * What a replica needs to do its job: Redis, Postgres and every BullMQ consumer it hosts.
 * Same shape as the worker's `/health`: checks are `ok | fail` only. Failure detail (queue names,
 * error messages) goes to the `health` log channel, never into the response.
 */
@Injectable()
export class ApiHealthService implements OnApplicationBootstrap {
  private readonly logger = createApiLogger({ channel: 'health' });
  private consumers: WorkerHost[] = [];

  constructor(private readonly discovery: DiscoveryService) {}

  /**
   * Every `@Processor` class is a `WorkerHost`, so discovery finds them all, including ones added
   * later: no hand-maintained list to forget. Their workers are created in `onModuleInit`, before
   * this hook runs.
   */
  onApplicationBootstrap(): void {
    const hosts = this.discovery
      .getProviders()
      .map((wrapper) => wrapper.instance as unknown)
      .filter((instance): instance is WorkerHost => instance instanceof WorkerHost);
    // A provider imported into several modules is listed once per module but is one worker.
    this.consumers = [...new Set(hosts)];
  }

  /** Every consumer this replica hosts (the watchdog closes the healthy ones before exiting). */
  consumerHosts(): readonly WorkerHost[] {
    return this.consumers;
  }

  /** The consumers that cannot pull jobs right now. Empty when all are fine. */
  async checkConsumers(): Promise<ConsumerStatus[]> {
    if (this.consumers.length === 0) {
      return [{ queue: '*', ok: false, reason: 'no BullMQ consumers discovered' }];
    }
    return failingConsumers(this.consumers);
  }

  /** Whether Redis answers, on the process-wide lock client so it does not depend on a worker connection. */
  async pingRedis(): Promise<boolean> {
    try {
      await withTimeout(pingLockClient(), HEALTH_CHECK_TIMEOUT_MS, 'redis');
      return true;
    } catch {
      return false;
    }
  }

  /** Never throws; logs only when a check fails (the worker writes the line, nothing is flushed here). */
  async check(): Promise<ApiHealthResult> {
    const failures: Record<string, unknown> = {};
    const probe = async (label: keyof ApiHealthChecks, fn: () => Promise<unknown>): Promise<HealthCheck> => {
      try {
        await withTimeout(fn(), HEALTH_CHECK_TIMEOUT_MS, label);
        return 'ok';
      } catch (error) {
        failures[label] = error instanceof Error ? error.message : String(error);
        return 'fail';
      }
    };

    const [redis, database, workers] = await Promise.all([
      probe('redis', pingLockClient),
      probe('database', () => getClient().query('SELECT 1')),
      probe('workers', async () => {
        const failing = await this.checkConsumers();
        if (failing.length > 0) {
          failures.consumers = failing.map(({ queue, reason }) => ({ queue, reason }));
          throw new Error(`${failing.length} queue consumer(s) down`);
        }
      }),
    ]);

    const checks: ApiHealthChecks = { redis, database, workers };
    const healthy = Object.values(checks).every((check) => check === 'ok');
    if (!healthy) {
      this.logger.error('API health check failed', { checks, failures }, { operation: 'health-check' });
    }
    return { healthy, checks };
  }
}
