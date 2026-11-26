import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter, Schema } from '../lib/facades';

const PLANS = TABLES_ENUM.PLANS;
const CONSTRAINT = 'plans_unique_identifier_unique';

/**
 * A stable internal key per plan (`free`, `plus`, `pro`).
 *
 * `plans.name` is display copy: it is the English name and the Stripe product name, and it
 * changes when the plans are renamed. The plans seed used to match rows by name, so a rename
 * would have inserted a duplicate plan. It now matches by this key instead.
 *
 * Existing rows are backfilled from their legacy names here. A fresh database has no plan
 * rows yet, so this is a no-op there and the seed writes the values.
 */
const up = async () => {
  await Schema.raw(`
    ALTER TABLE ${PLANS}
      ADD COLUMN IF NOT EXISTS unique_identifier VARCHAR(32) NULL;
  `);

  await Schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${CONSTRAINT}') THEN
        ALTER TABLE ${PLANS} ADD CONSTRAINT ${CONSTRAINT} UNIQUE (unique_identifier);
      END IF;
    END
    $$;
  `);

  await Schema.raw(`
    UPDATE ${PLANS}
    SET unique_identifier = CASE name
      WHEN 'Beginner' THEN 'free'
      WHEN 'Freelancer' THEN 'plus'
      WHEN 'Studio' THEN 'pro'
    END
    WHERE name IN ('Beginner', 'Freelancer', 'Studio') AND unique_identifier IS NULL;
  `);
};

/** Dropping the column drops its unique constraint with it. */
const down = async () => {
  await Alter.table(PLANS).dropColumnIfExists('unique_identifier');
};

export { up, down };
