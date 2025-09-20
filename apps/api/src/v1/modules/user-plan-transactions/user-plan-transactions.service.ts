import { Injectable } from '@nestjs/common';
import { CreateUserPlanTransactionDto } from './dto/create-user-plan-transaction.dto';
import { UpdateUserPlanTransactionDto } from './dto/update-user-plan-transaction.dto';

@Injectable()
export class UserPlanTransactionsService {
  create(createUserPlanTransactionDto: CreateUserPlanTransactionDto) {
    return 'This action adds a new userPlanTransaction';
  }

  findAll() {
    return `This action returns all userPlanTransactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userPlanTransaction`;
  }

  update(id: number, updateUserPlanTransactionDto: UpdateUserPlanTransactionDto) {
    return `This action updates a #${id} userPlanTransaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} userPlanTransaction`;
  }
}
