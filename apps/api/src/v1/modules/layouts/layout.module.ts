import { Module } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { LayoutRepository } from './layout.repository';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [LayoutController],
  providers: [
    LayoutService,
    LayoutRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'layouts',
        });
      },
    },
  ],
  exports: [LayoutService],
})
export class LayoutModule {}
