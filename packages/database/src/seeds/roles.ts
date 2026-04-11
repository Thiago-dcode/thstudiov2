import { ENUMS, EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Query } from '../lib/facades';

export const main = async () => {
  for (const name of ENUMS.USER_ROLE) {
    const exists = await Query.table(TABLES_ENUM.ROLES)
      .where('name', '=', name as EnumType<'USER_ROLE'>)
      .exists();
    if (!exists) {
      await Query.table(TABLES_ENUM.ROLES).insert(['name'], [name]);
    }
  }
};
