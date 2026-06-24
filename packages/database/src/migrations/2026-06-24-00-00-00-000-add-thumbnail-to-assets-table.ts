import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter } from '../lib/facades';

const ASSETS = TABLES_ENUM.ASSETS;

const up = async () => {
  await Alter.table(ASSETS).addColumnIfNotExists(
    'thumbnail',
    'VARCHAR(255)',
    { nullable: true },
  );
};

const down = async () => {
  await Alter.table(ASSETS).dropColumnIfExists('thumbnail');
};

export { up, down };
