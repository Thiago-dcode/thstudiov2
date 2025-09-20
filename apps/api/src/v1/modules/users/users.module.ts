import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { PlansRepository } from '../plans/plans.repository';
import { UserExtraDataModule } from './user-extra-data/user-extra-data.module';

@Module({
  controllers: [UserController],
  providers: [UserService,UserRepository, PlansRepository],
  imports: [UserExtraDataModule],
})
export class UserModule {}
