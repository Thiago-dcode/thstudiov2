import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { IndexPlanRequest } from './requests/index-plan.request';
// import { CreatePlanDto } from './dto/create-plan.dto';
// import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // @Post()
  // create(@Body() createPlanDto: CreatePlanDto) {
  //   return this.plansService.create(createPlanDto);
  // }

  @Get()
  findAll(@Query() indexPlanRequest: IndexPlanRequest) {
    return this.plansService.findAll(indexPlanRequest);
  }

  @Get('free')
  async findFreePlan() {
     return await this.plansService.findFreePlan();
  
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
  //   return this.plansService.update(+id, updatePlanDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.plansService.remove(+id);
  // }
}
