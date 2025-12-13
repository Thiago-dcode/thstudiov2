import { Module } from '@nestjs/common';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataController } from './user-extra-data.controller';
import { UserExtraDataRepository } from './user-extra-data.repository';

@Module({
  controllers: [UserExtraDataController],
  providers: [UserExtraDataService, UserExtraDataRepository],
  exports: [UserExtraDataRepository],
})
export class UserExtraDataModule {}
