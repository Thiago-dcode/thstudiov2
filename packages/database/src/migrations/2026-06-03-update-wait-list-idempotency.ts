import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Schema } from '../lib/facades';

const WAIT_LIST = TABLES_ENUM.WAIT_LIST;

const up = async () => {
  await Schema.raw(`ALTER TYPE WAIT_LIST_STATUS ADD VALUE IF NOT EXISTS 'INVITING';`);

  await Schema.table(WAIT_LIST).createIndexIfNotExists('LOWER(TRIM(email))', {
    unique: true,
    name: 'uq_wait_list_email_normalized',
  });
};

const down = async () => {
  await Schema.table(WAIT_LIST).dropIndexIfExists('uq_wait_list_email_normalized');
};

export { up, down };
