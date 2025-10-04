import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
@Module({
  exports: [],
  controllers: [MediaController],
  providers: [],
  imports: [],
})
export class MediaModule {}
