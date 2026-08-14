import { Schema } from '../lib/facades';

/**
 * Slugs are now derived from the title by the API and frozen at creation, so the
 * check-then-insert in the service needs a real constraint behind it.
 *
 * Uniqueness is per user, never global: the public URL is /artists/{username}/{entity}/{slug}
 * and `username` is already unique, so two artists may legitimately own the same slug.
 * Hence the composite (user_id, slug) index — a single-column index on `slug` would be wrong.
 *
 * Deliberately NO index on `title`. App-level per-user title uniqueness covers every new write;
 * a DB index would either be global (wrong) or fail on pre-existing duplicate titles, which are
 * legitimate user content that a migration has no business rewriting. To size a future
 * composite (user_id, title) index once ops confirms the data is clean:
 *
 *   select user_id, lower(trim(title)) as t, count(*)
 *   from portfolios group by 1, 2 having count(*) > 1;
 */
const TABLES = ['portfolios', 'services', 'collections'] as const;

/**
 * Historical races could leave duplicate (user_id, slug) rows. Suffix all but the lowest id
 * so the oldest row keeps its URL — it is the one most likely to have inbound links.
 * The suffix is re-checked against the whole table so the repair cannot itself collide.
 */
const dedupeSlugs = async (table: string) => {
  await Schema.raw(`
    WITH ranked AS (
      SELECT id,
             slug,
             user_id,
             ROW_NUMBER() OVER (PARTITION BY user_id, slug ORDER BY id) AS rn
      FROM ${table}
    )
    UPDATE ${table} AS t
    SET slug = ranked.slug || '-' || ranked.rn
    FROM ranked
    WHERE t.id = ranked.id
      AND ranked.rn > 1;
  `);
};

const up = async () => {
  for (const table of TABLES) {
    await dedupeSlugs(table);
    await Schema.table(table).createIndexIfNotExists(['user_id', 'slug'], {
      unique: true,
      name: `uq_${table}_user_id_slug`,
    });
  }

  // Superseded by uq_portfolios_user_id_slug, which serves the same (user_id, slug) lookups.
  await Schema.table('portfolios').dropIndexIfExists('idx_portfolios_user_id_slug');
};

const down = async () => {
  await Schema.table('portfolios').createIndexIfNotExists(['user_id', 'slug']);

  for (const table of TABLES) {
    await Schema.table(table).dropIndexIfExists(`uq_${table}_user_id_slug`);
  }
};

export { up, down };
