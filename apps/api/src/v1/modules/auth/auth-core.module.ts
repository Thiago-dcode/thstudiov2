import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LogService } from '@repo/backend-lib/services/log-service';
import { PublicViewerService } from 'src/common/services/public-viewer.service';
import { AuthHelper } from './auth-helper.service';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [UserSessionsModule],
  providers: [
    AuthHelper,
    PublicViewerService,
    JwtService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'auth',
        });
      },
    },
  ],
  exports: [AuthHelper, PublicViewerService, JwtService, LogService],
})
export class AuthCoreModule {}
