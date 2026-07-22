import { Module } from '@nestjs/common';
import { InvitationLinkService } from './invitation-link.service';
import { InvitationLinkRepository } from './invitation-link.repository';
import { InvitationLinkController } from './invitation-link.controller';
import { InvitationLinkMail } from './mails/invitation-link.mail';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { BenefitsModule } from '../benefits/benefits.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';

@Module({
  imports: [BenefitsModule, EmailPreferencesModule],
  controllers: [InvitationLinkController],
  providers: [
    InvitationLinkService,
    InvitationLinkRepository,
    InvitationLinkMail,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'invitation-links',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [InvitationLinkService],
})
export class InvitationLinkModule {}
