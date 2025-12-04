import { Controller, Get, Param, Delete, Post } from '@nestjs/common';
import { PlanSubscriptionsService } from './plan-subscriptions.service';
import { InitiatePlanSubscriptionRequest } from './requests/initiate-plan-subscription.request';

@Controller('plan-subscriptions')
export class PlanSubscriptionsController {
  constructor(
    private readonly planSubscriptionsService: PlanSubscriptionsService,
  ) {}

  @Get()
  findAll() {
    return this.planSubscriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planSubscriptionsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planSubscriptionsService.remove(+id);
  }

  @Post()
  initiate(initiateRequest: InitiatePlanSubscriptionRequest) {

    return this.planSubscriptionsService.initiate(initiateRequest)
  }
}
