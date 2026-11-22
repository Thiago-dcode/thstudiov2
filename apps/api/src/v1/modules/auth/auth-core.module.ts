import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PublicViewerService } from 'src/common/services/public-viewer.service';
import { AuthHelper } from './auth-helper.service';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';

@Module({
  imports: [UserSessionsModule],
  providers: [
    AuthHelper,
    PublicViewerService,
    JwtService,
  ],
  exports: [AuthHelper, PublicViewerService, JwtService],
})
export class AuthCoreModule {}
