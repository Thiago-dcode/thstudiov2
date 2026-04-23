import { Module } from '@nestjs/common';
import { PlanSubscriptionsService } from './plan-subscriptions.service';
import { PlanSubscriptionsController } from './plan-subscriptions.controller';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { PlanPricesModule } from '../plan-prices/plan-prices.module';
import { PlansModule } from '../plans/plans.module';
import { PaymentMethodsService } from '../utils/payment-methods.service';
import { UserBenefitModule } from '../user-benefit/user-benefit.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  imports: [
    PlanPricesModule, 
    PlansModule,
    UserBenefitModule
  ],
  controllers: [PlanSubscriptionsController],
  providers: [
    PlanSubscriptionsService, 
    PlanSubscriptionsRepository,
    PaymentMethodsService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'subscriptions',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [PlanSubscriptionsService],
})
export class PlanSubscriptionsModule {}
