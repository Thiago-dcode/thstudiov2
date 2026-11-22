import { Module } from '@nestjs/common';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { LayoutRepository } from './layout.repository';

@Module({
  controllers: [LayoutController],
  providers: [
    LayoutService,
    LayoutRepository,
  ],
  exports: [LayoutService],
})
export class LayoutModule {}
