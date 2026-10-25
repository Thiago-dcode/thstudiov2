import { InjectQueue, Processor } from '@nestjs/bullmq';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import { EDGE_HTML_MAX_STALE_MS } from '@repo/common-lib/constants/edge-cache';
import { EDGE_CACHE_QUEUE, JOB_PURGE_ARTIST_EDGE_CACHE } from '@repo/common-lib/constants/queues';
import { PurgeArtistEdgeCacheJobInput } from '@repo/common-lib/types/edge-cache';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { UsernameHistoryRepository } from '../username-history/username-history.repository';
import { UserRepository } from '../users/users.repository';
import { EdgeCacheService } from './edge-cache.service';
import { EdgePurgeLedger } from './edge-purge-ledger';

export type PurgeArtistEdgeCacheResult =
  | { purged: false; reason: string }
  | { purged: true; names: number; prefixes: number; requests: number };

/**
 * One job at a time per replica. Deliberately no BullMQ `limiter`: it would count every job,
 * including the skips that never reach Cloudflare. The rate is enforced on real calls only, by
 * `EdgePurgeLedger.takeSlots` (4 per sliding minute across every replica, which leaves room in the
 * account's purge budget for the deploy's hostname purge).
 */
export const EDGE_CACHE_PROCESSOR_OPTIONS = {
  concurrency: 1,
};

/**
 * Margin for clock skew between the process that enqueued a job (`job.timestamp`) and the one that
 * stamped the last purge. A job this close to that purge is purged again rather than risk a miss.
 */
export const EDGE_PURGE_COVER_SKEW_MS = 1_000;

@Processor(EDGE_CACHE_QUEUE, EDGE_CACHE_PROCESSOR_OPTIONS)
export class EdgeCacheProcessor extends GlobalProcessor {
  constructor(
    private readonly edgeCacheService: EdgeCacheService,
    private readonly userRepository: UserRepository,
    private readonly usernameHistoryRepository: UsernameHistoryRepository,
    private readonly logger: LogService,
    private readonly ledger: EdgePurgeLedger,
    @InjectQueue(EDGE_CACHE_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job<PurgeArtistEdgeCacheJobInput>): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_PURGE_ARTIST_EDGE_CACHE:
          return await this.purgeArtist(job);
        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.logger.flushAsync();
    }
  }

  private async purgeArtist(
    job: Job<PurgeArtistEdgeCacheJobInput>,
  ): Promise<PurgeArtistEdgeCacheResult> {
    const userId = job.data.user_id;
    const log = this.logger.name('purge');

    const target = this.edgeCacheService.purgeTarget();
    if ('skip' in target) {
      log.info(`Edge purge of user [${userId}] skipped: ${target.skip}`);
      return { purged: false, reason: target.skip };
    }

    // Queued past the edge TTL (held back by the rate limit): those pages have refreshed already,
    // so the request would only spend rate budget.
    if (Date.now() - job.timestamp > EDGE_HTML_MAX_STALE_MS) {
      log.info(`Edge purge of user [${userId}] skipped: older than the edge TTL`);
      return { purged: false, reason: 'stale' };
    }

    // A purge of this artist started after this trigger: it read the change this job is for, so
    // this one is already done. This is what collapses a backlog for one artist (a bulk upload whose
    // items finish seconds apart) into a single call, and it costs no rate budget.
    const lastPurgedAt = await this.ledger.lastPurgedAt(userId);
    if (lastPurgedAt !== null && lastPurgedAt >= job.timestamp + EDGE_PURGE_COVER_SKEW_MS) {
      log.info(`Edge purge of user [${userId}] skipped: covered by a later purge`);
      return { purged: false, reason: 'covered' };
    }

    // Before the names are read: everything written before this instant is in what gets purged.
    const startedAt = Date.now();
    const names = await this.resolveUsernames(job.data);
    const {
      chunks,
      names: nameCount,
      dropped,
    } = this.edgeCacheService.buildPrefixes(target.host, names);
    if (dropped) {
      log.warn(`Edge purge of user [${userId}]: dropped ${dropped} invalid username(s)`);
    }
    if (!chunks.length) {
      log.info(`Edge purge of user [${userId}] skipped: no username to purge`);
      return { purged: false, reason: 'no usernames' };
    }

    const slot = await this.ledger.takeSlots(chunks.length);
    if ('retryInMs' in slot) {
      // Back to the FRONT of the queue, without spending an attempt, and this worker pauses until
      // a slot frees up. It runs again then, and may by then be covered by another purge.
      log.info(`Edge purge of user [${userId}] waiting ${Math.ceil(slot.retryInMs / 1000)} s for a purge slot`);
      await this.queue.rateLimit(slot.retryInMs);
      throw Worker.RateLimitError();
    }

    for (const prefixes of chunks) {
      await this.edgeCacheService.purgePrefixes(target, prefixes);
    }
    await this.ledger.markPurged(userId, startedAt);
    const prefixCount = chunks.reduce((total, chunk) => total + chunk.length, 0);
    log.info(
      `Edge purge of user [${userId}]: ${nameCount} username(s), ${prefixCount} prefixes, ${chunks.length} request(s)`,
    );
    return { purged: true, names: nameCount, prefixes: prefixCount, requests: chunks.length };
  }

  /**
   * Resolved now rather than at enqueue time, so a debounced `replace` can never lose a name: the
   * payload's (a hard-deleted account has no row left), the current one, and every previous one
   * still reserved (each 308s to the current one). Two indexed lookups.
   */
  private async resolveUsernames(data: PurgeArtistEdgeCacheJobInput): Promise<string[]> {
    const [current, reserved] = await Promise.all([
      this.currentUsername(data.user_id),
      this.usernameHistoryRepository.findReservedByUser(data.user_id),
    ]);
    return [...(data.usernames ?? []), ...(current ? [current] : []), ...reserved];
  }

  /** Whatever the account's visibility: a hidden artist's cached pages must go too. */
  private async currentUsername(userId: number): Promise<string | null> {
    try {
      return (await this.userRepository.findByIdCompact(userId))?.username ?? null;
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) return null;
      throw error;
    }
  }
}
