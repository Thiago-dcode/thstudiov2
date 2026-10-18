import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import {
  DEFAULT_LAYOUT_ITEMS_CONFIG,
  MIN_COLUMN_BASE_COLUMNS,
} from '@repo/common-lib/constants/limits';
import { Schema } from '../lib/facades';

const LAYOUTS = TABLES_ENUM.LAYOUTS;
const LAYOUT_CONFIG = TABLES_ENUM.LAYOUT_CONFIG;

const DEFAULT_ITEMS = JSON.stringify(DEFAULT_LAYOUT_ITEMS_CONFIG);

/** Restricts an UPDATE on `layout_config` (aliased `lc`) to rows of one layout. */
const ofLayout = (name: string) =>
  `lc.layout_id = l.id AND l.name = '${name}'`;

// Configurable layouts move from a flat config to `{ layout: {...}, items: {...} }`:
// COLUMN_BASE `{ columns }` → `{ layout: { columns }, items }`, UNIFORM `null` → `{ layout: {}, items }`.
const up = async () => {
  await Schema.raw(`
    UPDATE ${LAYOUT_CONFIG} lc
    SET config = jsonb_build_object(
      'layout', jsonb_build_object(
        'columns', COALESCE(lc.config->'columns', '${MIN_COLUMN_BASE_COLUMNS}'::jsonb)
      ),
      'items', '${DEFAULT_ITEMS}'::jsonb
    )
    FROM ${LAYOUTS} l
    WHERE ${ofLayout('COLUMN_BASE')}
      AND (lc.config IS NULL OR NOT lc.config ? 'layout');
  `);

  await Schema.raw(`
    UPDATE ${LAYOUT_CONFIG} lc
    SET config = jsonb_build_object('layout', '{}'::jsonb, 'items', '${DEFAULT_ITEMS}'::jsonb)
    FROM ${LAYOUTS} l
    WHERE ${ofLayout('UNIFORM')}
      AND (lc.config IS NULL OR NOT lc.config ? 'items');
  `);
};

const down = async () => {
  await Schema.raw(`
    UPDATE ${LAYOUT_CONFIG} lc
    SET config = jsonb_build_object(
      'columns', COALESCE(lc.config->'layout'->'columns', '${MIN_COLUMN_BASE_COLUMNS}'::jsonb)
    )
    FROM ${LAYOUTS} l
    WHERE ${ofLayout('COLUMN_BASE')}
      AND lc.config ? 'layout';
  `);

  await Schema.raw(`
    UPDATE ${LAYOUT_CONFIG} lc
    SET config = NULL
    FROM ${LAYOUTS} l
    WHERE ${ofLayout('UNIFORM')};
  `);
};

export { up, down };
