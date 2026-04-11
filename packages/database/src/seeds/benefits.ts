import { ENUMS, EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Query } from '../lib/facades';

const BENEFIT_BY_TYPE: Record<
  EnumType<'BENEFIT_TYPE'>,
  { name: string; trial_days: number }
> = {
  EARLY_USER: { name: 'EARLY_USER_3_MONTH_FREE', trial_days: 90 },
  VIP: { name: 'VIP_USER_6_MONTH_FREE', trial_days: 180 },
};

export const main = async () => {
  for (const type of ENUMS.BENEFIT_TYPE) {
    const row = BENEFIT_BY_TYPE[type];
    const exists = await Query.table(TABLES_ENUM.BENEFITS)
      .where('type', '=', type)
      .exists();
    if (!exists) {
      await Query.table(TABLES_ENUM.BENEFITS).insert(
        ['type', 'name', 'trial_days', 'active'],
        [type, row.name, row.trial_days, true],
      );
    }
  }
};
