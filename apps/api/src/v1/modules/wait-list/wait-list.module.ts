import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import {
  LOG_QUEUE,
  WAIT_LIST_QUEUE,
  EMAIL_PREFERENCES_QUEUE,
} from '@repo/common-lib/constants/queues';
import { Queue } from 'bullmq';
import { BenefitsModule } from '../benefits/benefits.module';
import { InvitationLinkModule } from '../invitation-links/invitation-link.module';
import { PlansModule } from '../plans/plans.module';
import { WaitListInviteMail } from './mails/wait-list-invite.mail';
import { WaitListWelcomeMail } from './mails/wait-list-welcome.mail';
import { WaitListReminderMail } from './mails/wait-list-reminder.mail';
import { WaitListController } from './wait-list.controller';
import { WaitListProcessor } from './wait-list.processor';
import { WaitListRepository } from './wait-list.repository';
import { WaitListService } from './wait-list.service';
import { WaitListTask } from './wait-list.task';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';

@Module({
  imports: [
    EmailPreferencesModule,
    InvitationLinkModule,
    BenefitsModule,
    PlansModule,
    BullModule.registerQueue({ name: WAIT_LIST_QUEUE }, { name: EMAIL_PREFERENCES_QUEUE }, { name: LOG_QUEUE }),
  ],
  controllers: [WaitListController],
  providers: [
    WaitListRepository,
    WaitListService,
    WaitListProcessor,
    WaitListWelcomeMail,
    WaitListInviteMail,
    WaitListReminderMail,
    WaitListTask,
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
