import { BenefitSchema, UserBenefitSchema } from "../schemas/benefit";

export type Benefit = Omit<BenefitSchema, 'created_at' | 'updated_at'>;

export type BenefitWithRedeemed = Benefit & {
    redeemed: boolean
}

export type CreateBenefitInput = Omit<BenefitSchema, 'id' | 'created_at' | 'updated_at'>;

export type UpdateBenefitInput = Partial<CreateBenefitInput>;

export type UserBenefit = Omit<UserBenefitSchema, 'created_at' | 'updated_at'>;

export type CreateUserBenefitInput = Omit<UserBenefitSchema, 'id' | 'created_at' | 'updated_at'>;

export type UpdateUserBenefitInput = Partial<Pick<UserBenefitSchema, 'redeemed'>>;
