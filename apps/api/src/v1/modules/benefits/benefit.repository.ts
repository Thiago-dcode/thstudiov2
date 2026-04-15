import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { FullBenefitSchemaColumns, FullUserBenefitSchema } from '@repo/common-lib/schemas/benefit';
import {  BenefitWithRedeemed } from '@repo/common-lib/types/benefit';
import { DbException } from '@repo/database/exceptions';

@Injectable()
export class BenefitRepository extends BaseRepository {
  private readonly COLUMNS: FullBenefitSchemaColumns[] = [
    'benefits.id',
    'benefits.active',
    'benefits.name',
    'benefits.trial_days',
    'benefits.stripe_coupon_id',
    'benefits.type',
    'user_benefits.id as u_id',
    'user_benefits.redeemed',
  ] as const;

  constructor(protected readonly logService: LogService) {
    super('benefits', logService);
  }

  async findByIdAndUser(id: number, userId: number): Promise<BenefitWithRedeemed> {

    const result = await this.query()
      .select(this.COLUMNS)
      .where('benefits.id', id)
      .join('id', 'user_benefits', 'benefit_id', 'INNER')
      .where('user_benefits.user_id', userId)
      .first<FullUserBenefitSchema>();
    if (!result) {
      throw new DbException('Could not redeem user benefit');
    }

    return this.format(result);
  }

  private format(result: FullUserBenefitSchema): BenefitWithRedeemed {
    return {
      id: result.id,
      active: result.active,
      name: result.name,
      stripe_coupon_id: result.stripe_coupon_id,
      trial_days: result.trial_days,
      type: result.type,
      redeemed: result.redeemed,
    };
  }
}
