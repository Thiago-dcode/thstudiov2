import { Module } from '@nestjs/common';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataController } from './user-extra-data.controller';

@Module({
  controllers: [UserExtraDataController],
  providers: [UserExtraDataService],
})
export class UserExtraDataModule {}
