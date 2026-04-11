import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { IndexPlanRequest } from './requests/index-plan.request';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @Public()
  findAll(@Query() indexPlanRequest: IndexPlanRequest) {
    return this.plansService.findAll(indexPlanRequest);
  }


  @Public()
  @Get('free')
  async findFreePlan() {
    return await this.plansService.findFreePlan();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(+id);
  }

}
