import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { LOG_QUEUE, WAIT_LIST_QUEUE } from '@repo/common-lib/constants/constants';
import { Queue } from 'bullmq';
import { BenefitsModule } from '../benefits/benefits.module';
import { InvitationLinkModule } from '../invitation-links/invitation-link.module';
import { WaitListInviteMail } from './mails/wait-list-invite.mail';
import { WaitListWelcomeMail } from './mails/wait-list-welcome.mail';
import { WaitListController } from './wait-list.controller';
import { WaitListProcessor } from './wait-list.processor';
import { WaitListRepository } from './wait-list.repository';
import { WaitListService } from './wait-list.service';

@Module({
  imports: [
    InvitationLinkModule,
    BenefitsModule,
    BullModule.registerQueue({ name: WAIT_LIST_QUEUE }, { name: LOG_QUEUE }),
  ],
  controllers: [WaitListController],
  providers: [
    WaitListRepository,
    WaitListService,
    WaitListProcessor,
    WaitListWelcomeMail,
    WaitListInviteMail,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'wait-list',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  exports: [WaitListService],
})
export class WaitListModule {}
