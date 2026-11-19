import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { getConfigValue } from '@repo/common-lib/config/utils';
import os from 'node:os';
import { logBuffer } from '@repo/backend-lib/config/logging';
import { withTimeout } from '@repo/backend-lib/utils';
import { createApiLogger } from '../utils/api-logger';
import { displayHost } from '../utils';
import { getLockClient } from '../utils/cron-lock';
import { ApiHealthService } from './api-health.service';
import { ConsumerStatus } from './consumer-health';

export const WATCHDOG_TICK_MS = 30_000;
/** Workers connect during boot; a tick in this window would count warm-up as a failure. */
export const WATCHDOG_BOOT_GRACE_MS = 60_000;
/** 4 ticks x 30 s: a consumer down for about 2 minutes. */
export const WATCHDOG_FAILURES_BEFORE_RESTART = 4;
/**
 * One replica restarts at a time. Must stay above the api `start_period` (45 s) plus boot time,
 * so the second replica only goes down once the first is back.
 */
export const WATCHDOG_RESTART_LOCK_KEY = 'api-watchdog:restart';
export const WATCHDOG_RESTART_LOCK_TTL_MS = 120_000;
/** Upper bound for closing the healthy workers before exit. */
export const WATCHDOG_CLOSE_TIMEOUT_MS = 10_000;
/** Upper bound for waiting on the alert mail enqueue before exit (`logBuffer.settle`). */
export const WATCHDOG_ALERT_SETTLE_MS = 5_000;

/**
 * Restarts this replica when one of its queue consumers stays down while Redis answers.
 *
 * Docker does not restart unhealthy containers, so `/health` alone only reports. This exits the
 * process and `restart: unless-stopped` brings it back with fresh workers. Only a fault local to
 * this process counts: a tick where Redis does not answer is not counted (an outage must not
 * become a restart loop), and Postgres is not looked at at all.
 *
 * Never calls `app.close()`: `main.ts` deliberately runs without global shutdown hooks.
 */
@Injectable()
export class ConsumerWatchdog implements OnApplicationBootstrap {
  private readonly logger = createApiLogger({ channel: 'health' });
  private readonly instanceId = `${replica()}:${process.pid}`;
  private startedAt: number;
  private consecutiveFailures = 0;
  private restarting = false;
  private noConsumersReported = false;

  constructor(private readonly health: ApiHealthService) {
    this.startedAt = this.now();
  }

  onApplicationBootstrap(): void {
    this.startedAt = this.now();
  }

  /** Seams for specs: the clock, the log settle and the exit. */
  protected now(): number {
    return Date.now();
  }

  /**
   * Waits for the critical line's push and its alert mail enqueue. Never a flush: the worker
   * writes the lines. Bounded: a hung Redis must not keep a broken replica up.
   */
  protected async settleLogs(): Promise<void> {
    try {
      await withTimeout(logBuffer.settle(), WATCHDOG_ALERT_SETTLE_MS, 'settle logs');
    } catch {
      // Out of time: exit anyway; the line or the mail may be lost.
    }
  }

  protected exit(code: number): void {
    process.exit(code);
  }

  /** Never throws: an error inside a tick is logged and counts as a passing tick. */
  @Interval('api-consumer-watchdog', WATCHDOG_TICK_MS)
  async tick(): Promise<void> {
    if (this.restarting) return;
    if (this.now() - this.startedAt < WATCHDOG_BOOT_GRACE_MS) return;
    try {
      await this.evaluate();
    } catch (error) {
      this.consecutiveFailures = 0;
      this.logger.error(
        'Consumer watchdog tick failed',
        { error_message: error instanceof Error ? error.message : String(error) },
        { operation: 'consumer-watchdog' },
      );
    }
  }

  private async evaluate(): Promise<void> {
    // Nothing discovered is a wiring bug, not a dead connection: a restart would come back the same
    // way and loop. `/health` keeps failing; alert once and never count it.
    if (this.health.consumerHosts().length === 0) {
      if (!this.noConsumersReported) {
        this.noConsumersReported = true;
        this.logger.critical(
          `API replica has no queue consumers (${displayHost(getConfigValue('app').url)})`,
          { replica: replica() },
          { operation: 'consumer-watchdog' },
        );
      }
      this.consecutiveFailures = 0;
      return;
    }

    const failing = await this.health.checkConsumers();
    if (failing.length === 0) {
      this.consecutiveFailures = 0;
      return;
    }
    // Redis down explains every consumer being down, and a restart would not fix it.
    if (!(await this.health.pingRedis())) {
      this.consecutiveFailures = 0;
      return;
    }

    this.consecutiveFailures++;
    this.logger.error(
      'Queue consumer down',
      {
        consecutive_failures: this.consecutiveFailures,
        restart_after: WATCHDOG_FAILURES_BEFORE_RESTART,
        consumers: summarize(failing),
      },
      { operation: 'consumer-watchdog' },
    );
    if (this.consecutiveFailures < WATCHDOG_FAILURES_BEFORE_RESTART) {
      return;
    }

    const isLocal = getConfigValue('app').env === 'local';
    // Locally there is nothing to restart us (`nest start --watch` would just stay down): alert only.
    if (!isLocal && !(await this.acquireRestartLock())) {
      // The other replica is restarting; try again next tick so the two never drop together.
      return;
    }

    this.logger.critical(
      `API replica restarting: queue consumer down (${displayHost(getConfigValue('app').url)}, ${replica()})`,
      {
        consumers: summarize(failing),
        consecutive_failures: this.consecutiveFailures,
        restart: !isLocal,
      },
      { operation: 'consumer-watchdog' },
    );

    if (isLocal) {
      this.consecutiveFailures = 0;
      return;
    }

    this.restarting = true;
    // Same order as the worker's shutdown: the closing jobs' lines are pushed too, then settle.
    await this.closeHealthyWorkers(failing);
    await this.settleLogs();
    this.exit(1);
  }

  private async acquireRestartLock(): Promise<boolean> {
    const client = await getLockClient();
    if (!client) return false;
    const reply = await client.set(WATCHDOG_RESTART_LOCK_KEY, this.instanceId, {
      condition: 'NX',
      expiration: { type: 'PX', value: WATCHDOG_RESTART_LOCK_TTL_MS },
    });
    return reply === 'OK';
  }

  /**
   * Lets the consumers that still work finish their current job instead of having it redelivered
   * after its lock expires. The broken ones are left alone: closing them could hang.
   */
  private async closeHealthyWorkers(failing: ConsumerStatus[]): Promise<void> {
    const broken = new Set(failing.map(({ queue }) => queue));
    const closing = this.health.consumerHosts().flatMap((host) => {
      try {
        const worker = host.worker;
        return broken.has(worker.name) ? [] : [worker.close()];
      } catch {
        return []; // never initialised: nothing to close
      }
    });
    try {
      await withTimeout(Promise.allSettled(closing), WATCHDOG_CLOSE_TIMEOUT_MS, 'close workers');
    } catch {
      // Out of time: exit anyway, BullMQ redelivers whatever was still active.
    }
  }
}

/** The replica name lines carry: the hostname (the container id in Docker). */
const replica = () => os.hostname().slice(0, 64);

const summarize = (failing: ConsumerStatus[]) => failing.map(({ queue, reason }) => ({ queue, reason }));
