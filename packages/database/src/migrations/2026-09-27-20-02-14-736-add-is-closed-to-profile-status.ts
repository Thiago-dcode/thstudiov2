import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter, Schema } from '../lib/facades';

const PROFILE_STATUS = TABLES_ENUM.PROFILE_STATUS;

const up = async () => {
  await Alter.table(PROFILE_STATUS).addColumnIfNotExists(
    'is_closed',
    'BOOLEAN',
    { default: false },
  );

  // Seed: close every profile that is already 100% complete.
  await Schema.raw(`
    UPDATE ${PROFILE_STATUS}
    SET is_closed = TRUE
    WHERE has_full_name_field
      AND has_profession_field
      AND has_avatar_field
      AND has_location
      AND has_categories
      AND has_portfolio
      AND has_media
      AND has_about_page
  `);
};

const down = async () => {
  await Alter.table(PROFILE_STATUS).dropColumnIfExists('is_closed');
};

export { up, down };
