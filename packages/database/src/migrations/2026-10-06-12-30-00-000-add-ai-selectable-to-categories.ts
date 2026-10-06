import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Alter } from '../lib/facades';

/**
 * Whether the AI metadata job may choose this category on its own. Defaults to true, which is how
 * every existing category already behaved.
 *
 * It is false for categories the pixels cannot prove — how a shot was made (HDR blending, focus
 * stacking, a panorama's stitching) rather than what it shows. Only the artist knows those, and a
 * wrong guess would be published as a keyword. The artist can still pick them.
 */
const up = async () => {
  await Alter.table(TABLES_ENUM.CATEGORIES).addColumnIfNotExists(
    'ai_selectable',
    'BOOLEAN',
    { default: true },
  );
};

const down = async () => {
  await Alter.table(TABLES_ENUM.CATEGORIES).dropColumnIfExists('ai_selectable');
};

export { up, down };
