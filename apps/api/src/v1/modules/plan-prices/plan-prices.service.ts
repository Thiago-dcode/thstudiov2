import { Injectable } from '@nestjs/common';
import { PlanPricesRepository } from './plan-prices.repository';

@Injectable()
export class PlanPricesService {
  constructor(private readonly planPriceRepository: PlanPricesRepository) {}

  async findOne(id: number) {
    const result = await this.planPriceRepository.findOne(id);
    return result;
  }
  async findOneByStripeId(id: string) {
    const result = await this.planPriceRepository.findOneByColumn(
      'stripe_id',
      id,
    );
    return result;
  }
  async findOneByPaypalId(id: number) {
    const result = await this.planPriceRepository.findOneByColumn(
      'paypal_id',
      id,
    );
    return result;
  }
}
