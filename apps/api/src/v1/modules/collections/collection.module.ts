import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionRepository } from './collection.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { LogService } from '@repo/backend-lib/services/log-service';
import { AuthCoreModule } from '../auth/auth-core.module';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [CollectionController],
  providers: [
    CollectionService,
    CollectionRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'collections',
        });
      },
    },
  ],
  // AuthCoreModule: `PublicViewerService`, so owners still see their hidden collections.
  imports: [UserExtraDataModule, AuthCoreModule],
  exports: [CollectionService, CollectionRepository],
})
export class CollectionModule {}
