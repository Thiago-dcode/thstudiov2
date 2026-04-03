import { Module } from '@nestjs/common';
import { UserCollectionService } from './user-collection.service';
import { UserRepository } from '../users/users.repository';
import { CollectionRepository } from '../collections/collection.repository';
import { UserCollectionController } from './user-collection.controller';

@Module({
  controllers: [UserCollectionController],
  providers: [UserCollectionService, UserRepository, CollectionRepository],
})
export class UserCollectionModule {}
