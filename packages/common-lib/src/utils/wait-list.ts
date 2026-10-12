import { EnumType } from "../constants/enums";

/**
 * Every wait-list member gets the same benefit (EARLY_USER, 3 months free), whatever their
 * position. The position is kept as a parameter so callers don't change if tiers come back.
 */
export function getWaitListBenefitType(_position: number): EnumType<'BENEFIT_TYPE'> {
  return 'EARLY_USER';
}

export function getBenefitMonths(trialDays: number): number {
  return Math.round(trialDays / 30);
}
