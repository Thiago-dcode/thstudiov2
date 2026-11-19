import { Module } from '@nestjs/common';
import { InvitationLinkService } from './invitation-link.service';
import { InvitationLinkRepository } from './invitation-link.repository';
import { InvitationLinkController } from './invitation-link.controller';
import { InvitationLinkMail } from './mails/invitation-link.mail';
import { LogService } from '@repo/backend-lib/services/log-service';
import { BenefitsModule } from '../benefits/benefits.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [BenefitsModule, EmailPreferencesModule],
  controllers: [InvitationLinkController],
  providers: [
    InvitationLinkService,
    InvitationLinkRepository,
    InvitationLinkMail,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'invitation-links',
        });
      },
    },
  ],
  exports: [InvitationLinkService],
})
export class InvitationLinkModule {}
