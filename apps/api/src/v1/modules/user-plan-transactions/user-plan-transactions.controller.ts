import { Controller, Get, Param, Delete } from '@nestjs/common';
import { UserPlanTransactionsService } from './user-plan-transactions.service';

@Controller('user-plan-transactions')
export class UserPlanTransactionsController {
  constructor(private readonly userPlanTransactionsService: UserPlanTransactionsService) {}


  @Get()
  findAll() {
    return this.userPlanTransactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userPlanTransactionsService.findOne(+id);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userPlanTransactionsService.remove(+id);
  }
}
