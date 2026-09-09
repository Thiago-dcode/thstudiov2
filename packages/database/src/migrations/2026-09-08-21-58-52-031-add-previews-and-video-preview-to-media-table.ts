import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter } from '../lib/facades';

const MEDIA = TABLES_ENUM.MEDIA;

/**
 * Video gains two assets beyond its poster frame.
 *
 * `previews` holds the ordered storage keys of the frames sampled across the clip (near-start,
 * middle, near-end). They are what moderation judges: one frame from the first second could
 * only ever vouch for the first second, so anything placed later went unseen. `thumbnail`
 * points at `previews[0]`, which is why nothing that already reads a thumbnail changes.
 *
 * `video_preview` is the short playable clip. It equals the media's own key when the source is
 * already short enough to be its own preview, so a row may share that value with `url`.
 */
const up = async () => {
  await Alter.table(MEDIA).addColumnIfNotExists('previews', 'JSONB', {
    nullable: true,
  });
  await Alter.table(MEDIA).addColumnIfNotExists('previews_bytes', 'INTEGER', {
    nullable: true,
  });
  await Alter.table(MEDIA).addColumnIfNotExists('video_preview', 'VARCHAR(255)', {
    nullable: true,
  });
  await Alter.table(MEDIA).addColumnIfNotExists('video_preview_bytes', 'INTEGER', {
    nullable: true,
  });
};

const down = async () => {
  await Alter.table(MEDIA).dropColumnIfExists('video_preview_bytes');
  await Alter.table(MEDIA).dropColumnIfExists('video_preview');
  await Alter.table(MEDIA).dropColumnIfExists('previews_bytes');
  await Alter.table(MEDIA).dropColumnIfExists('previews');
};

export { up, down };
