import { EnumType } from "../constants/enums";

const VIP_POSITION_THRESHOLD = 50;

export function getWaitListBenefitType(position: number): EnumType<'BENEFIT_TYPE'> {
  return position <= VIP_POSITION_THRESHOLD ? 'VIP' : 'EARLY_USER';
}

export function getBenefitMonths(trialDays: number): number {
  return Math.round(trialDays / 30);
}
