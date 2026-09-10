import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Schema } from '../lib/facades';

const MEDIA = TABLES_ENUM.MEDIA;
const CONSTRAINT = 'media_completed_has_completed_at';

/**
 * The mirror of `media_failed_has_no_completed_at`: a COMPLETED media must CARRY a
 * `completed_at`.
 *
 * `completed_at` is the column everything asks "does this row have an asset it is safe to show?"
 * - the atelier list filter, the public media pages, `MediaHelper.isCompleted`. Exactly one
 * writer sets it (the worker's success commit, alongside the compressed bytes), and the failure
 * paths clear it, so the answer is trustworthy in one direction. It was not trustworthy in the
 * other: rows could read COMPLETED with no timestamp at all, and there were two ways in.
 *
 * 1. The column was added with `status` defaulting to `'COMPLETED'`, so every row predating it -
 *    and every seeded row, which never sets either column - is COMPLETED with a null timestamp.
 *    That is the 17-of-20 disappearance on dev.
 * 2. The update and metadata jobs park a row in UPDATING / GENERATING_METADATA and used to hand
 *    it back as a flat `COMPLETED`, whatever it had been before. An update against a FAILED or
 *    still-uploading media therefore minted a COMPLETED row with nothing behind it.
 *
 * Both writers are fixed (`MediaRepository.restoreStatus` / `MediaHelper.restingStatus`); this
 * repairs the history they left and stops the pairing from drifting again.
 */
const up = async () => {
  // Rows with real assets: the timestamp was simply never recorded. `updated_at` is the closest
  // thing to "when processing finished" that survives, and a completion date that is a little
  // late is worth incomparably more than a row that renders nowhere.
  await Schema.raw(`
    UPDATE ${MEDIA}
    SET completed_at = COALESCE(updated_at, created_at)
    WHERE status = 'COMPLETED'
      AND completed_at IS NULL
      AND bytes > 0
      AND thumbnail IS NOT NULL;
  `);

  // Whatever is left claims COMPLETED while holding no asset - no compressed bytes, no
  // thumbnail. Those are case 2 above, and the truthful resting state for an upload that never
  // produced anything is FAILED. Backfilling them instead would do the one thing this whole
  // change exists to prevent: bless a row with no asset as safe to show.
  await Schema.raw(`
    UPDATE ${MEDIA}
    SET status = 'FAILED',
        failed_reason = COALESCE(failed_reason, 'Media processing never completed')
    WHERE status = 'COMPLETED'
      AND completed_at IS NULL;
  `);

  await Schema.raw(`
    ALTER TABLE ${MEDIA}
      ADD CONSTRAINT ${CONSTRAINT}
      CHECK (status <> 'COMPLETED' OR completed_at IS NOT NULL);
  `);
};

/**
 * Only drops the constraint. The backfilled timestamps stay: they are the best record that
 * exists of when those rows finished, and re-nulling them would hide the media all over again.
 */
const down = async () => {
  await Schema.raw(`
    ALTER TABLE ${MEDIA}
      DROP CONSTRAINT IF EXISTS ${CONSTRAINT};
  `);
};

export { up, down };
