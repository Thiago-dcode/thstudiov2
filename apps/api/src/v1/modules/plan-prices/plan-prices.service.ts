import { Injectable } from '@nestjs/common';
import { PlanPricesRepository } from './plan-prices.repository';

@Injectable()
export class PlanPricesService {
  constructor(private readonly planPriceRepository: PlanPricesRepository) {}

  async findOne(id: number) {
    const result = await this.planPriceRepository.findOne(id);
    return result;
  }
 
}
