import { Module } from '@nestjs/common';
import { UserCollectionService } from './user-collection.service';
import { UserRepository } from '../users/users.repository';
import { CollectionRepository } from '../collections/collection.repository';
import { UserCollectionController } from './user-collection.controller';
import { AuthCoreModule } from '../auth/auth-core.module';

@Module({
  // AuthCoreModule: `PublicArtistGuard` resolves the owner's token on hidden accounts.
  imports: [AuthCoreModule],
  controllers: [UserCollectionController],
  providers: [UserCollectionService, UserRepository, CollectionRepository],
})
export class UserCollectionModule {}
