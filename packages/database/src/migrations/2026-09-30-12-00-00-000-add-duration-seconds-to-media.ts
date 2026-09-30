import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter } from '../lib/facades';

/**
 * A video's length in whole seconds, measured by the worker while it transcodes (it already knew
 * it, and only logged it). Search engines read it from `VideoObject.duration` and the video
 * sitemap's `<video:duration>`. Null for images and GIFs, and for videos processed before this.
 */
const up = async () => {
  await Alter.table(TABLES_ENUM.MEDIA).addColumnIfNotExists('duration_seconds', 'INTEGER', {
    nullable: true,
  });
};

const down = async () => {
  await Alter.table(TABLES_ENUM.MEDIA).dropColumnIfExists('duration_seconds');
};

export { up, down };
