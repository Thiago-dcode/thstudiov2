import { Module } from '@nestjs/common';
import { InvitationLinkService } from './invitation-link.service';
import { InvitationLinkRepository } from './invitation-link.repository';

@Module({
  providers: [InvitationLinkService, InvitationLinkRepository],
  exports: [InvitationLinkService],
})
export class InvitationLinkModule {}
