import { Module } from '@nestjs/common';
import { BenefitRepository } from './benefit.repository';

@Module({
  providers: [BenefitRepository],
  exports: [BenefitRepository],
})
export class BenefitsModule {}
