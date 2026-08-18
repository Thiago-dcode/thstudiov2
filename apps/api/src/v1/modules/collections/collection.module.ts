import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionRepository } from './collection.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { AI_QUEUE, USER_METRICS_QUEUE } from '@repo/common-lib/constants/constants';

@Module({
  controllers: [CollectionController],
  providers: [
    CollectionService,
    CollectionRepository,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'collections',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  imports: [BullModule.registerQueue({ name: AI_QUEUE }, { name: USER_METRICS_QUEUE }), UserExtraDataModule],
  exports: [CollectionService, CollectionRepository],
})
export class CollectionModule {}
