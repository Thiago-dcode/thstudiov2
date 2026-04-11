import { Injectable } from '@nestjs/common';
import { BenefitWithRedeemed, UserBenefit } from '@repo/common-lib/types/benefit';
import { UserService } from '../users/users.service';
import { UserBenefitRepository } from './user-benefit.repository';
import { BenefitRepository } from '../benefits/benefit.repository';
import { Helpers } from 'src/common/services/helpers.service';

@Injectable()
export class UserBenefitService {
  constructor(
    private readonly userService: UserService,
    private readonly userBenefitRepository: UserBenefitRepository,
    private readonly benefitRepository: BenefitRepository,
    private readonly helpers: Helpers,
  ) { }

  async getByUserId(userId: number): Promise<BenefitWithRedeemed | null> {
    const user = await this.userService.getCompactedById(userId);
    if (!user?.benefit_id) return null;
    return await this.helpers.cacheRemember(`user-benefit-${userId}`, this.getByIdAndUser(user.benefit_id, user.id), {
      ttl: 1000 * 60 * 60 * 24,
    });

  }

  async getByIdAndUser(id: number, userId: number): Promise<BenefitWithRedeemed> {
    return await this.benefitRepository.findByIdAndUser(id, userId);
  }

  async redeem(userId: number, benefitId: number): Promise<UserBenefit> {
    const [result] = await Promise.all([this.userBenefitRepository.redeem(userId, benefitId), this.helpers.deleteCached(`user-benefit-${userId}`)]);
    return result;

  }

  async create(userId: number, benefitId: number): Promise<UserBenefit> {
    return await this.userBenefitRepository.create({
      user_id: userId,
      benefit_id: benefitId,
      redeemed: false,
    });
  }
}
