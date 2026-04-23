import { Module } from '@nestjs/common';
import { AiMediaController } from './ai-media.controller';
import { AiMediaService } from './ai-media.service';
import { MediaModule } from '../media/media.module';
import { AiModule } from '../ai/ai.module';
import { AddressModule } from '../addresses/address.module';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiConsumptionGuard } from 'src/common/guards/ai-consumption.guard';

@Module({
  controllers: [AiMediaController],
  providers: [AiMediaService, AiConsumptionGuard],
  imports: [MediaModule, AiModule, AddressModule, UserExtraDataModule],
})
export class AiMediaModule {}
