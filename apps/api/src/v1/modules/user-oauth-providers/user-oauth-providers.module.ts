import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { LOG_QUEUE } from '@repo/common-lib/constants/queues';
import { Queue } from 'bullmq';
import { UserOauthProvidersRepository } from './user-oauth-providers.repository';
import { UserOauthProvidersService } from './user-oauth-providers.service';

/** Accounts linked through an OAuth provider (Google), with refresh tokens encrypted at rest. No routes. */
@Module({
  imports: [BullModule.registerQueue({ name: LOG_QUEUE })],
  providers: [
    UserOauthProvidersRepository,
    UserOauthProvidersService,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) =>
        FactoryLogService.createLogService('file', { channel: 'user-oauth-providers' }, logQueue),
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  exports: [UserOauthProvidersService],
})
export class UserOauthProvidersModule {}
