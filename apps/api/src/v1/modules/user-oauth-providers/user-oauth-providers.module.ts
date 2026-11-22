import { Module } from '@nestjs/common';
import { UserOauthProvidersRepository } from './user-oauth-providers.repository';
import { UserOauthProvidersService } from './user-oauth-providers.service';

/** Accounts linked through an OAuth provider (Google), with refresh tokens encrypted at rest. No routes. */
@Module({
  providers: [
    UserOauthProvidersRepository,
    UserOauthProvidersService,
  ],
  exports: [UserOauthProvidersService],
})
export class UserOauthProvidersModule {}
