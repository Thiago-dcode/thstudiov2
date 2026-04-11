import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceRepository } from './service.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiModule } from '../ai/ai.module';

@Module({
  controllers: [ServiceController],
  providers: [ServiceService, ServiceRepository],
  imports: [UserExtraDataModule, AiModule],
  exports: [ServiceService],
})
export class ServiceModule {}
