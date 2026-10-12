
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter } from '../lib/facades';

const WAIT_LIST = TABLES_ENUM.WAIT_LIST;

const up = async () => {
  await Alter.table(WAIT_LIST).addColumnIfNotExists(
    'validated_email_sent_at',
    'TIMESTAMP',
    { nullable: true },
  );
  await Alter.table(WAIT_LIST).addColumnIfNotExists(
    'follow_up_email_sent_at',
    'TIMESTAMP',
    { nullable: true },
  );
};

const down = async () => {
  await Alter.table(WAIT_LIST).dropColumnIfExists('follow_up_email_sent_at');
  await Alter.table(WAIT_LIST).dropColumnIfExists('validated_email_sent_at');
};

export { up, down };
