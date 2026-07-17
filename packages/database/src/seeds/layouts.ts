import { ENUMS, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Query } from '../lib/facades';

export const main = async () => {
  for (const name of ENUMS.LAYOUT_TYPE) {
    const exists = await Query.table(TABLES_ENUM.LAYOUTS)
      .where('name', '=', name)
      .exists();
    if (!exists) {
      await Query.table(TABLES_ENUM.LAYOUTS).insert(
        ['name', 'is_active'],
        [name, true],
      );
    }
  }
};
