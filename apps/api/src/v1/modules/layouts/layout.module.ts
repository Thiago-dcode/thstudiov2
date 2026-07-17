import { Module } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { LayoutRepository } from './layout.repository';

@Module({
  controllers: [LayoutController],
  providers: [
    LayoutService,
    LayoutRepository,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'layouts',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [LayoutService],
})
export class LayoutModule {}
