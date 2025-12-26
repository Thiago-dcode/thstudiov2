import { Module } from '@nestjs/common';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataRepository } from './user-extra-data.repository';

@Module({
  providers: [UserExtraDataService, UserExtraDataRepository],
  exports: [UserExtraDataRepository, UserExtraDataService],
})
export class UserExtraDataModule {}
