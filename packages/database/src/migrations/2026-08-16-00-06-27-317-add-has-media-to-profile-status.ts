import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter } from '../lib/facades';

const PROFILE_STATUS = TABLES_ENUM.PROFILE_STATUS;

const up = async () => {
  await Alter.table(PROFILE_STATUS).addColumnIfNotExists(
    'has_media',
    'BOOLEAN',
    { default: false },
  );
};

const down = async () => {
  await Alter.table(PROFILE_STATUS).dropColumnIfExists('has_media');
};

export { up, down };
