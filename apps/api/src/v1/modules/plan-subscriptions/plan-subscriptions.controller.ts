import { Body, Controller, Get, Param, Delete, Post } from '@nestjs/common';
import { PlanSubscriptionsService } from './plan-subscriptions.service';
import { InitiatePlanSubscriptionRequest } from './requests/initiate-plan-subscription.request';

@Controller('subscriptions')
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

  @Post('initiate')
  initiate(@Body() initiateRequest: InitiatePlanSubscriptionRequest) {
    console.log(initiateRequest)
    return this.planSubscriptionsService.initiate(initiateRequest)
  }
}
