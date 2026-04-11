import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { UserBenefitSchema, UserBenefitSchemaColumns } from '@repo/common-lib/schemas/benefit';
import { UserBenefit, CreateUserBenefitInput } from '@repo/common-lib/types/benefit';
import { DbException } from '@repo/database/exceptions';

@Injectable()
export class UserBenefitRepository extends BaseRepository {
  private readonly COLUMNS: UserBenefitSchemaColumns[] = [
    'user_benefits.id',
    'user_benefits.user_id',
    'user_benefits.benefit_id',
    'user_benefits.redeemed',
  ] as const;

  constructor() {
    super('user_benefits');
  }

  async create(input: CreateUserBenefitInput): Promise<UserBenefit> {
    const cols = Object.keys(input);
    const values = Object.values(input);

    const result = await this.query().insertAndGet<UserBenefitSchema>(cols, values);
    if (!result) {
      throw new DbException('Could not create user benefit');
    }

    return this.format(result);
  }

  async redeem(userId: number, benefitId: number): Promise<UserBenefit> {
    await this.query()
      .where('user_id', '=', userId)
      .where('benefit_id', '=', benefitId)
      .update(['redeemed'], [true]);

    const result = await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .where('benefit_id', '=', benefitId)
      .first<UserBenefitSchema>();

    if (!result) {
      throw new DbException('Could not redeem user benefit');
    }

    return this.format(result);
  }

  private format(result: UserBenefitSchema): UserBenefit {
    return {
      id: result.id,
      user_id: result.user_id,
      benefit_id: result.benefit_id,
      redeemed: result.redeemed,
    };
  }
}
