import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetsRepository } from './assets.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [AssetsController],
  providers: [
    AssetsService,
    AssetsRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'assets',
        });
      },
    },
  ],
  exports: [AssetsService],
})
export class AssetsModule {}
