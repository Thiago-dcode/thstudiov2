import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Schema } from '../lib/facades';

/**
 * The atelier media list counts, per media, the collections and portfolios it appears in. The
 * pivots' unique constraints lead with the owning side (`collection_id, media_id`), so a lookup
 * by `media_id` alone — or by `collection_id` on `portfolio_collection` — cannot use them and
 * would scan the whole pivot for every row on the page.
 */
const up = async () => {
  await Schema.table(TABLES_ENUM.COLLECTION_MEDIA).createIndexIfNotExists('media_id');
  await Schema.table(TABLES_ENUM.PORTFOLIO_MEDIA).createIndexIfNotExists('media_id');
  await Schema.table(TABLES_ENUM.PORTFOLIO_COLLECTION).createIndexIfNotExists('collection_id');
};

const down = async () => {
  await Schema.table(TABLES_ENUM.PORTFOLIO_COLLECTION).dropIndexIfExists(
    'idx_portfolio_collection_collection_id',
  );
  await Schema.table(TABLES_ENUM.PORTFOLIO_MEDIA).dropIndexIfExists('idx_portfolio_media_media_id');
  await Schema.table(TABLES_ENUM.COLLECTION_MEDIA).dropIndexIfExists('idx_collection_media_media_id');
};

export { up, down };
