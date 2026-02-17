import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { UserModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  imports: [UserExtraDataModule, UserModule, AiModule],
  exports: [MediaService],
})
export class MediaModule { }
