import { Module } from '@nestjs/common';
import { UserBenefitService } from './user-benefit.service';
import { UserBenefitController } from './user-benefit.controller';
import { UserBenefitRepository } from './user-benefit.repository';
import { BenefitRepository } from '../benefits/benefit.repository';
import { UserModule } from '../users/users.module';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [UserModule],
  controllers: [UserBenefitController],
  providers: [
    UserBenefitService,
    UserBenefitRepository,
    BenefitRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'user-benefit',
        });
      },
    },
  ],
  exports: [UserBenefitService],
})
export class UserBenefitModule {}
