import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EDGE_CACHE_QUEUE } from '@repo/common-lib/constants/queues';
import { UsernameHistoryModule } from '../username-history/username-history.module';
import { UserRepository } from '../users/users.repository';
import { EdgeCacheProcessor } from './edge-cache.processor';
import { EdgeCacheService } from './edge-cache.service';
import { EdgePurgeLedger } from './edge-purge-ledger';

/**
 * Purges an artist's edge-cached public pages from Cloudflare when they change (no HTTP surface).
 * Takes the user repository directly rather than importing `UserModule`.
 */
@Module({
  imports: [
    BullModule.registerQueue({ name: EDGE_CACHE_QUEUE }),
    UsernameHistoryModule,
  ],
  providers: [
    EdgeCacheService,
    EdgeCacheProcessor,
    EdgePurgeLedger,
    UserRepository,
  ],
})
export class EdgeCacheModule {}
