import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Schema } from '../lib/facades';

const MEDIA = TABLES_ENUM.MEDIA;
const CONSTRAINT = 'media_failed_has_no_completed_at';

/**
 * A FAILED media must never carry a `completed_at`.
 *
 * The two disagreed in production: a redelivered job failed after an earlier attempt had
 * already committed, and `markFailed` set the status without clearing the timestamp. The row
 * then read as finished to anything keying off `completed_at` - which is exactly how a failed
 * upload ended up rendering in the atelier grid.
 *
 * The application now clears it on both write paths, but this is the half that cannot be
 * forgotten by a future writer.
 */
const up = async () => {
  // Must run before the constraint: rows that already violate it would abort the ALTER.
  await Schema.raw(`
    UPDATE ${MEDIA}
    SET completed_at = NULL
    WHERE status = 'FAILED' AND completed_at IS NOT NULL;
  `);

  await Schema.raw(`
    ALTER TABLE ${MEDIA}
      ADD CONSTRAINT ${CONSTRAINT}
      CHECK (status <> 'FAILED' OR completed_at IS NULL);
  `);
};

/**
 * Only drops the constraint. The cleared timestamps are not restored - they were wrong, and
 * the attempt that produced them is long gone, so there is nothing to restore them from.
 */
const down = async () => {
  await Schema.raw(`
    ALTER TABLE ${MEDIA}
      DROP CONSTRAINT IF EXISTS ${CONSTRAINT};
  `);
};

export { up, down };
