import { Module } from '@nestjs/common';
import { UserBenefitService } from './user-benefit.service';
import { UserBenefitController } from './user-benefit.controller';
import { UserBenefitRepository } from './user-benefit.repository';
import { BenefitRepository } from '../benefits/benefit.repository';
import { UserModule } from '../users/users.module';

@Module({
  imports: [UserModule],
  controllers: [UserBenefitController],
  providers: [UserBenefitService, UserBenefitRepository, BenefitRepository],
  exports: [UserBenefitService],
})
export class UserBenefitModule {}
