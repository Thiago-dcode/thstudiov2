import { Body, Controller, Get, Param, Delete, Post } from '@nestjs/common';
import { PlanSubscriptionsService } from './plan-subscriptions.service';
import { InitiatePlanSubscriptionRequest } from './requests/initiate-plan-subscription.request';

@Controller('subscriptions')
export class PlanSubscriptionsController {
  constructor(
    private readonly planSubscriptionsService: PlanSubscriptionsService,
  ) {}

  @Get()
  async findAll() {
    return await this.planSubscriptionsService.findAll();
  }

  @Get(':id')
 async findOne(@Param('id') id: string) {
    return await this.planSubscriptionsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planSubscriptionsService.remove(+id);
  }

  @Post('initiate')
  async initiate(@Body() initiateRequest: InitiatePlanSubscriptionRequest) {
    return await this.planSubscriptionsService.initiate(initiateRequest)
  }
}
