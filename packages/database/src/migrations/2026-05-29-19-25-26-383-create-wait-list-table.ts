
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Column, Schema } from 'src/lib/facades';

const WAIT_LIST = TABLES_ENUM.WAIT_LIST;
const INVITATION_LINKS = TABLES_ENUM.INVITATION_LINKS;

const up = async () => {
  await Schema.table(WAIT_LIST).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.email('email'),
    Column.smallInteger('position', { nullable: true }),
    Column.enum('status', 'WAIT_LIST_STATUS', { default: 'WAITING' }),
    Column.timestamp('redeemed_at', { nullable: true }),
    Column.foreignKey('invitation_link_id', INVITATION_LINKS, 'id', {
      onDelete: 'SET NULL',
      nullable: true,
    }),
  ]);
};

const down = async () => {
  await Schema.table(WAIT_LIST).dropIfExists();
};

export { up, down };
