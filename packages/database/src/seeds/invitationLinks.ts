import { EnumType } from '@repo/common-lib/constants/enums';
import { Query } from '../lib/facades';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';

export const main = async () => {
  const earlyBenefitType: EnumType<'BENEFIT_TYPE'> = 'EARLY_USER';
  const earlyUserBenefit = await Query.table('benefits')
    .select('id')
    .where('type', '=', earlyBenefitType)
    .where('active', true)
    .first<{ id: number }>();

  if (!earlyUserBenefit) {
    throw new Error('early user benefit does not exist');
  }

  for (let i = 0; i < 30; i++) {
    const code = await generateUUID();
    await Query.table('invitation_links').insert(
      ['code', 'benefit_id', 'max_uses'],
      [code, earlyUserBenefit.id, 1],
    );
  }

  const vipBenefitType: EnumType<'BENEFIT_TYPE'> = 'VIP';
  const vipBenefit = await Query.table('benefits')
    .select('id')
    .where('type', '=', vipBenefitType)
    .where('active', true)
    .first<{ id: number }>();

  if (!vipBenefit) {
    throw new Error('VIP benefit does not exist');
  }

  for (let i = 0; i < 10; i++) {
    const code = await generateUUID();
    await Query.table('invitation_links').insert(
      ['code', 'benefit_id', 'max_uses'],
      [code, vipBenefit.id, 1],
    );
  }
};
