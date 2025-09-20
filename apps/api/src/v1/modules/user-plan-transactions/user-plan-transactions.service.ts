import { Injectable } from '@nestjs/common';
import { CreateUserPlanTransactionRequest } from './requests/create-user-plan-transaction.requests';
import { UpdateUserPlanTransactionRequest } from './requests/update-user-plan-transaction.requests';
import { UserPlanTransactionsRepository } from './user-plan-transactions.repository';
import { generateUUID } from '@repo/backend-lib/utils';
import { EnumType } from '@repo/database/schemas/database';

@Injectable()
export class UserPlanTransactionsService {
  constructor(
    private readonly userPlanTransactionsRepository: UserPlanTransactionsRepository,
  ) {}
  async create({
    amount,
    user_id,
    plan_price_id,
    status,
    payment_status,
    payment_method,
    plan_offer_id,
  }: CreateUserPlanTransactionRequest) {
    const result = await this.userPlanTransactionsRepository.create({
      amount,
      user_id,
      plan_price_id,
      status: status as EnumType<'TRANSACTION_STATUS'>,
      payment_status: payment_status as EnumType<'PAYMENT_STATUS'>,
      payment_method: payment_method
        ? (payment_method as EnumType<'PAYMENT_METHOD'>)
        : null,
      transaction_id: await generateUUID(),
      plan_offer_id,
    });
    return result;
  }

  findAll() {
    return `This action returns all userPlanTransactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userPlanTransaction`;
  }

  update(
    id: number,
    updateUserPlanTransactionDto: UpdateUserPlanTransactionRequest,
  ) {
    console.log(id, updateUserPlanTransactionDto);
    return `This action updates a #${id} userPlanTransaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} userPlanTransaction`;
  }
}
