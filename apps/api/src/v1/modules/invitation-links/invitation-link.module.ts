import { Module } from '@nestjs/common';
import { InvitationLinkService } from './invitation-link.service';
import { InvitationLinkRepository } from './invitation-link.repository';
import { InvitationLinkController } from './invitation-link.controller';
import { InvitationLinkMail } from './mails/invitation-link.mail';
import { BenefitsModule } from '../benefits/benefits.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';

@Module({
  imports: [BenefitsModule, EmailPreferencesModule],
  controllers: [InvitationLinkController],
  providers: [
    InvitationLinkService,
    InvitationLinkRepository,
    InvitationLinkMail,
  ],
  exports: [InvitationLinkService],
})
export class InvitationLinkModule {}
