import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter } from '../lib/facades';

/**
 * The second of a video the artist picked as its cover, after the worker clamped it into the
 * clip. `REAL` rather than `NUMERIC` so `pg` hands it back as a number, not a string. Null means
 * "never picked": the cover is the default frame, inset past the opening second.
 */
const up = async () => {
  await Alter.table(TABLES_ENUM.MEDIA).addColumnIfNotExists('thumbnail_time_seconds', 'REAL', {
    nullable: true,
  });
};

const down = async () => {
  await Alter.table(TABLES_ENUM.MEDIA).dropColumnIfExists('thumbnail_time_seconds');
};

export { up, down };
