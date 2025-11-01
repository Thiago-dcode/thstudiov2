import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  PlanTransactionSchema,
  PlanTransactionColumns,
  CreatePlanTransactionInput,
} from '@repo/common-lib/schemas/user-plan-transaction';
import { UserPlanTransaction } from './user-plan-transactions.type';

@Injectable()
export class UserPlanTransactionsRepository extends BaseRepository {
  private readonly COLUMNS: PlanTransactionColumns[] = [
    'user_plan_transactions.id',
    'user_plan_transactions.transaction_id',
    'user_plan_transactions.status',
    'user_plan_transactions.payment_status',
    'user_plan_transactions.payment_method',
    'user_plan_transactions.amount',
    'user_plan_transactions.user_id',
    'user_plan_transactions.plan_price_id',
    'user_plan_transactions.plan_offer_id',
  ];

  constructor() {
    super('user_plan_transactions');
  }

  async applyFilters(filters: any) {
    console.log(filters);
  }

  async create(
    createUserPlanTransaction: CreatePlanTransactionInput,
  ): Promise<UserPlanTransaction> {
    const columns = Object.keys(createUserPlanTransaction);
    const values = Object.values(createUserPlanTransaction) as any[];
    return await this.queryBuilder.insertAndGet<PlanTransactionSchema>(
      columns,
      values,
      this.COLUMNS,
    );
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
