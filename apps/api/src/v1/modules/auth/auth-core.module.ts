import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { AuthHelper } from './auth-helper.service';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';

@Module({
  imports: [UserSessionsModule],
  providers: [
    AuthHelper,
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
  exports: [AuthHelper, JwtService, LogService],
})
export class AuthCoreModule {}
