import { getClient } from 'src/lib/client';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';

const USERS = TABLES_ENUM.USERS;

const up = async () => {
  await getClient().query(`ALTER TABLE ${USERS} ALTER COLUMN twofa_code TYPE VARCHAR(60);`);
};

const down = async () => {
  await getClient().query(`ALTER TABLE ${USERS} ALTER COLUMN twofa_code TYPE VARCHAR(10);`);
};

export { up, down };
