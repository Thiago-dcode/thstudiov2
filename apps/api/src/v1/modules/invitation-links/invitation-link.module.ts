import { Module } from '@nestjs/common';
import { InvitationLinkService } from './invitation-link.service';
import { InvitationLinkRepository } from './invitation-link.repository';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  providers: [
    InvitationLinkService,
    InvitationLinkRepository,
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
