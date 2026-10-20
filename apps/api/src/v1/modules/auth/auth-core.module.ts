import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { PublicViewerService } from 'src/common/services/public-viewer.service';
import { AuthHelper } from './auth-helper.service';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';

@Module({
  imports: [UserSessionsModule],
  providers: [
    AuthHelper,
    PublicViewerService,
    JwtService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'auth',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [AuthHelper, PublicViewerService, JwtService, LogService],
})
export class AuthCoreModule {}
