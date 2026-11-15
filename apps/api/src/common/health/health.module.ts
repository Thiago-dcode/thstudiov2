import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ApiHealthService } from './api-health.service';
import { ConsumerWatchdog } from './consumer-watchdog';
import { MONITORED_QUEUES, QueueStuckJobsTask } from './queue-stuck-jobs.task';

/**
 * Replica health: the internal `GET /health` probe (registered on Express in `main.ts`, outside
 * `/api/v1`), the consumer watchdog that restarts a replica whose queue consumers stay down, and
 * the stuck/failed-job alert. No controller: none of this is a public route.
 */
@Module({
  imports: [DiscoveryModule, BullModule.registerQueue(...MONITORED_QUEUES.map((name) => ({ name })))],
  providers: [ApiHealthService, ConsumerWatchdog, QueueStuckJobsTask],
  exports: [ApiHealthService],
})
export class HealthModule {}
