import { Module } from '@nestjs/common';
import { UserMediaController } from './media.controller';
import { MediaModule } from '../media/media.module';


@Module({
  controllers: [UserMediaController],
  imports: [MediaModule],
})
export class UserMediaModule {}
