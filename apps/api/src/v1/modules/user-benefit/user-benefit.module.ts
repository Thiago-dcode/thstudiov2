import { Module } from '@nestjs/common';
import { UserBenefitService } from './user-benefit.service';
import { UserBenefitController } from './user-benefit.controller';
import { UserBenefitRepository } from './user-benefit.repository';
import { BenefitRepository } from '../benefits/benefit.repository';
import { UserModule } from '../users/users.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  imports: [UserModule],
  controllers: [UserBenefitController],
  providers: [
    UserBenefitService,
    UserBenefitRepository,
    BenefitRepository,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'user-benefit',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [UserBenefitService],
})
export class UserBenefitModule {}
