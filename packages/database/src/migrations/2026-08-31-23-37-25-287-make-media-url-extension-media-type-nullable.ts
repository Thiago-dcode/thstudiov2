import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Schema } from '../lib/facades';

const MEDIA = TABLES_ENUM.MEDIA;

const up = async () => {
  await Schema.raw(`
    ALTER TABLE ${MEDIA}
      ALTER COLUMN url DROP NOT NULL,
      ALTER COLUMN extension DROP NOT NULL,
      ALTER COLUMN media_type DROP NOT NULL;
  `);
};

const down = async () => {
  await Schema.raw(
    `UPDATE ${MEDIA} SET url = 'pending/' || public_id WHERE url IS NULL`,
  );
  await Schema.raw(`UPDATE ${MEDIA} SET extension = '' WHERE extension IS NULL`);
  await Schema.raw(
    `UPDATE ${MEDIA} SET media_type = 'IMAGE' WHERE media_type IS NULL`,
  );
  await Schema.raw(`
    ALTER TABLE ${MEDIA}
      ALTER COLUMN url SET NOT NULL,
      ALTER COLUMN extension SET NOT NULL,
      ALTER COLUMN media_type SET NOT NULL;
  `);
};

export { up, down };
