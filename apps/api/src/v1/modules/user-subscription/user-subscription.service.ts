import { Injectable } from '@nestjs/common';
import { Helpers } from 'src/common/services/helpers.service';
import { PlanSubscriptionsRepository } from '../plan-subscriptions/plan-subscriptions.repository';
import { CACHE_KEY_ACTIVE_SUBSCRIPTION } from '@repo/common-lib/constants/cache';

const CACHE_TTL = 1000 * 60 * 60 * 24;

@Injectable()
export class UserSubscriptionService {
  constructor(
    private readonly planSubscriptionsRepository: PlanSubscriptionsRepository,
    private readonly helpers: Helpers,
  ) {}

  async findActiveSubscription(userId: number) {
    return await this.helpers.cacheRemember(
      CACHE_KEY_ACTIVE_SUBSCRIPTION(userId),
      this.planSubscriptionsRepository.findActiveSubscription(userId),
      {
        append_language: false,
        ttl: CACHE_TTL,
      },
    );
  }
}
