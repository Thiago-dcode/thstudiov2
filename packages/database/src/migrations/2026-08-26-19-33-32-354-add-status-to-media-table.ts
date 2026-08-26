import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter, Schema } from '../lib/facades';

const MEDIA = TABLES_ENUM.MEDIA;

const up = async () => {
  await Schema.dropEnumIfExists('MEDIA_STATUS');
  await Schema.createEnumIfNotExists('MEDIA_STATUS');
  await Alter.table(MEDIA).addColumnIfNotExists(
    'status',
    'MEDIA_STATUS',
    { default: 'COMPLETED' },
  );
  await Alter.table(MEDIA).addColumnIfNotExists(
    'completed_at',
    'TIMESTAMP',
    { nullable: true },
  );
  await Alter.table(MEDIA).addColumnIfNotExists(
    'failed_reason',
    'VARCHAR(255)',
    { nullable: true },
  );
};

const down = async () => {
  await Alter.table(MEDIA).dropColumnIfExists('failed_reason');
  await Alter.table(MEDIA).dropColumnIfExists('completed_at');
  await Alter.table(MEDIA).dropColumnIfExists('status');
  await Schema.dropEnumIfExists('MEDIA_STATUS');
};

export { up, down };
