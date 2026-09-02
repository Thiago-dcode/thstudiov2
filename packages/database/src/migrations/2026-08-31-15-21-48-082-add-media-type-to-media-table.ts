import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter, Schema } from '../lib/facades';

const MEDIA = TABLES_ENUM.MEDIA;

const up = async () => {
  await Schema.dropEnumIfExists('MEDIA_TYPE');
  await Schema.createEnumIfNotExists('MEDIA_TYPE');
  await Alter.table(MEDIA).addColumnIfNotExists('media_type', 'MEDIA_TYPE', {
    default: 'IMAGE',
  });
};

const down = async () => {
  await Alter.table(MEDIA).dropColumnIfExists('media_type');
  await Schema.dropEnumIfExists('MEDIA_TYPE');
};

export { up, down };
