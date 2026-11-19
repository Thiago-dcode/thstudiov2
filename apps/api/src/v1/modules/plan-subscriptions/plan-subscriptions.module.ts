import { Module } from '@nestjs/common';
import { PlanSubscriptionsService } from './plan-subscriptions.service';
import { PlanSubscriptionsController } from './plan-subscriptions.controller';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { PlanPricesModule } from '../plan-prices/plan-prices.module';
import { PlansModule } from '../plans/plans.module';
import { PaymentMethodsService } from '../utils/payment-methods.service';
import { UserBenefitModule } from '../user-benefit/user-benefit.module';
import { UserModule } from '../users/users.module';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    PlanPricesModule,
    PlansModule,
    UserBenefitModule,
    UserModule,
  ],
  controllers: [PlanSubscriptionsController],
  providers: [
    PlanSubscriptionsService, 
    PlanSubscriptionsRepository,
    PaymentMethodsService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'plan-subscriptions',
        });
      },
    },
  ],
  exports: [PlanSubscriptionsService],
})
export class PlanSubscriptionsModule {}
