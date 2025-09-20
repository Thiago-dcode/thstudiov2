import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserPlanTransactionsService } from './user-plan-transactions.service';
import { CreateUserPlanTransactionDto } from './dto/create-user-plan-transaction.dto';
import { UpdateUserPlanTransactionDto } from './dto/update-user-plan-transaction.dto';

@Controller('user-plan-transactions')
export class UserPlanTransactionsController {
  constructor(private readonly userPlanTransactionsService: UserPlanTransactionsService) {}

  @Post()
  create(@Body() createUserPlanTransactionDto: CreateUserPlanTransactionDto) {
    return this.userPlanTransactionsService.create(createUserPlanTransactionDto);
  }

  @Get()
  findAll() {
    return this.userPlanTransactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userPlanTransactionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserPlanTransactionDto: UpdateUserPlanTransactionDto) {
    return this.userPlanTransactionsService.update(+id, updateUserPlanTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userPlanTransactionsService.remove(+id);
  }
}
