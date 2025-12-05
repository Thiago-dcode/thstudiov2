import { Injectable } from '@nestjs/common';
import {
  CreatePlanSubscriptionInput,
  PlanSubscriptionSchema,
  UpdatePlanSubscriptionInput,
} from '@repo/common-lib/schemas/plan-subscription';
import { BaseRepository } from '@repo/database/repositories';

@Injectable()
export class PlanSubscriptionsRepository extends BaseRepository {
  constructor() {
    super('plan_subscriptions');
  }

  async create(plan: CreatePlanSubscriptionInput) {
    const columns = Object.keys(plan);
    const values = Object.values(plan);
    return await this.queryBuilder.insertAndGet<PlanSubscriptionSchema>(
      columns,
      values,
    );
  }


  async updateOne(id: string | number, plan: UpdatePlanSubscriptionInput) {
    await super.updateOne(id, plan);
    return this.queryBuilder
      .where('id', '=', id)
      .first<PlanSubscriptionSchema>();
  }

  async findOneByUser(userId: number) {
    return await this.queryBuilder
      .where('user_id', '=', userId)
      .first<PlanSubscriptionSchema>();
  }
}
