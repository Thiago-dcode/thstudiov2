import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetsRepository } from './assets.repository';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  controllers: [AssetsController],
  providers: [
    AssetsService,
    AssetsRepository,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'assets',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [AssetsService],
})
export class AssetsModule {}
