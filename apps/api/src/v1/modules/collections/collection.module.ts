import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionRepository } from './collection.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';

@Module({
  controllers: [CollectionController],
  providers: [CollectionService, CollectionRepository],
  imports: [UserExtraDataModule],
  exports: [CollectionService, CollectionRepository],
})
export class CollectionModule {}
