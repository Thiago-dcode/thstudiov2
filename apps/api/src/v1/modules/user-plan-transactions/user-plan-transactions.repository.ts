import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CreatePlanTransactionInput,
  PlanTransaction,
} from '../../../../../../packages/database/dist/src/lib/constants/schemas/user-plan-transaction';

@Injectable()
export class UserPlanTransactionsRepository extends BaseRepository {
  constructor() {
    super('user_plan_transactions');
  }

  async applyFilters(filters: any) {
    console.log(filters);
  }

  async create(createUserPlanTransaction: CreatePlanTransactionInput) {
    const columns = Object.keys(createUserPlanTransaction);
    const values = Object.values(createUserPlanTransaction);
    return await this.queryBuilder.insertAndGet<PlanTransaction>(
      columns,
      values,
    );
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
