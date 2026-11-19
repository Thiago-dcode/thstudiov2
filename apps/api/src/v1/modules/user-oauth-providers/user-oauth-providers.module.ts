import { Module } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { UserOauthProvidersRepository } from './user-oauth-providers.repository';
import { UserOauthProvidersService } from './user-oauth-providers.service';
import { createApiLogger } from 'src/common/utils/api-logger';

/** Accounts linked through an OAuth provider (Google), with refresh tokens encrypted at rest. No routes. */
@Module({
  providers: [
    UserOauthProvidersRepository,
    UserOauthProvidersService,
    {
      provide: LogService,
      useFactory: () => createApiLogger({ channel: 'user-oauth-providers' }),
    },
  ],
  exports: [UserOauthProvidersService],
})
export class UserOauthProvidersModule {}
