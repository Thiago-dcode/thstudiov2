import { Module } from '@nestjs/common';
import { UserServiceService } from './user-service.service';
import { UserRepository } from '../users/users.repository';
import { ServiceRepository } from '../services/service.repository';
import { UserServiceController } from './user-service.controller';
import { AuthCoreModule } from '../auth/auth-core.module';

@Module({
  // AuthCoreModule: `PublicArtistGuard` resolves the owner's token on hidden accounts.
  imports: [AuthCoreModule],
  controllers: [UserServiceController],
  providers: [UserServiceService, UserRepository, ServiceRepository],
})
export class UserServiceModule {}
