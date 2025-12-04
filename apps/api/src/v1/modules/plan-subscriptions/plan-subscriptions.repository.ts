import { Injectable } from '@nestjs/common';
import {
  CreatePlanSubscriptionInput,
  PlanSubscriptionSchema,
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
}
