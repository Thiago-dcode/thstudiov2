
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter } from '../lib/facades';

const WAIT_LIST = TABLES_ENUM.WAIT_LIST;

const up = async () => {
  await Alter.table(WAIT_LIST).addColumnIfNotExists(
    'invitation_email_sent_at',
    'TIMESTAMP',
    { nullable: true },
  );
  await Alter.table(WAIT_LIST).addColumnIfNotExists(
    'welcome_email_sent_at',
    'TIMESTAMP',
    { nullable: true },
  );
  await Alter.table(WAIT_LIST).addColumnIfNotExists(
    'last_reminder_email_sent_at',
    'TIMESTAMP',
    { nullable: true },
  );
  await Alter.table(WAIT_LIST).addColumnIfNotExists(
    'reminder_count',
    'SMALLINT',
    { default: 0 },
  );
};

const down = async () => {
  await Alter.table(WAIT_LIST).dropColumnIfExists('reminder_count');
  await Alter.table(WAIT_LIST).dropColumnIfExists('last_reminder_email_sent_at');
  await Alter.table(WAIT_LIST).dropColumnIfExists('welcome_email_sent_at');
  await Alter.table(WAIT_LIST).dropColumnIfExists('invitation_email_sent_at');
};

export { up, down };
