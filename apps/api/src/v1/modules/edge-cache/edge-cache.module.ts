import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { EDGE_CACHE_QUEUE, LOG_QUEUE } from '@repo/common-lib/constants/queues';
import { UsernameHistoryModule } from '../username-history/username-history.module';
import { UserRepository } from '../users/users.repository';
import { EdgeCacheProcessor } from './edge-cache.processor';
import { EdgeCacheService } from './edge-cache.service';
import { EdgePurgeLedger } from './edge-purge-ledger';

/**
 * Purges an artist's edge-cached public pages from Cloudflare when they change (no HTTP surface).
 * Takes the user repository directly rather than importing `UserModule`, like `AccountDeletionModule`.
 */
@Module({
  imports: [
    BullModule.registerQueue({ name: EDGE_CACHE_QUEUE }, { name: LOG_QUEUE }),
    UsernameHistoryModule,
  ],
  providers: [
    EdgeCacheService,
    EdgeCacheProcessor,
    EdgePurgeLedger,
    UserRepository,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) =>
        FactoryLogService.createLogService('file', { channel: 'edge-cache' }, logQueue),
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
})
export class EdgeCacheModule {}
