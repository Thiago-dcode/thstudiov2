import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionRepository } from './collection.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AuthCoreModule } from '../auth/auth-core.module';

@Module({
  controllers: [CollectionController],
  providers: [
    CollectionService,
    CollectionRepository,
  ],
  // AuthCoreModule: `PublicViewerService`, so owners still see their hidden collections.
  imports: [UserExtraDataModule, AuthCoreModule],
  exports: [CollectionService, CollectionRepository],
})
export class CollectionModule {}
