import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { toPlaceSlug } from '@repo/common-lib/utils/place-slug';
import { Alter, Column, Schema } from '../lib/facades';

const MEDIA = TABLES_ENUM.MEDIA;
const LOCATIONS = TABLES_ENUM.LOCATIONS;
const COUNTRIES = TABLES_ENUM.COUNTRIES;
const STATES = TABLES_ENUM.STATES;
const CITIES = TABLES_ENUM.CITIES;

const HIERARCHY = [COUNTRIES, STATES, CITIES] as const;

/**
 * Stamps every existing hierarchy row with the slug the API now derives on write
 * (`toPlaceSlug`). Done in JS rather than SQL so the backfill and every future write share one
 * definition — a SQL re-implementation would drift, and a drifted slug is a duplicate row.
 * The tables are only fed by address saves, so they are small enough for one batched UPDATE.
 */
const backfillSlugs = async (table: (typeof HIERARCHY)[number]) => {
  const result = await Schema.raw(`SELECT id, name FROM ${table} WHERE slug IS NULL`);
  const rows = (result?.rows ?? []) as { id: number; name: string }[];
  if (!rows.length) return;

  await Schema.raw(
    `UPDATE ${table} AS t
     SET slug = v.slug
     FROM unnest($1::int[], $2::text[]) AS v(id, slug)
     WHERE t.id = v.id`,
    [
      `{${rows.map((row) => row.id).join(',')}}`,
      `{${rows.map((row) => JSON.stringify(toPlaceSlug(row.name))).join(',')}}`,
    ],
  );
};

/**
 * The hierarchy used to match names exactly and upsert with find-then-insert, so "Málaga" and
 * "Malaga" — or two racing address saves — could each mint a row. Now that places get pages
 * keyed by slug, those twins must become one row before the unique indexes go on.
 *
 * Merging is safe *today* and only today: nothing outside the hierarchy holds an id into it yet
 * (addresses store plain text), so repointing children and deleting the twins loses nothing.
 * The lowest id survives. Order matters — countries first, so states that only differed by
 * their duplicated country collapse in the next step, and cities after states.
 */
const mergeDuplicates = async () => {
  await Schema.raw(`
    WITH ranked AS (
      SELECT id, MIN(id) OVER (PARTITION BY slug) AS keeper FROM ${COUNTRIES}
    ), moved_states AS (
      UPDATE ${STATES} s SET country_id = r.keeper FROM ranked r
      WHERE s.country_id = r.id AND r.id <> r.keeper
    ), moved_cities AS (
      UPDATE ${CITIES} c SET country_id = r.keeper FROM ranked r
      WHERE c.country_id = r.id AND r.id <> r.keeper
    )
    SELECT 1;
  `);
  await Schema.raw(`
    DELETE FROM ${COUNTRIES} c
    USING ${COUNTRIES} k
    WHERE k.slug = c.slug AND k.id < c.id;
  `);

  await Schema.raw(`
    UPDATE ${CITIES} c SET state_id = k.keeper
    FROM (
      SELECT id, MIN(id) OVER (PARTITION BY country_id, slug) AS keeper FROM ${STATES}
    ) k
    WHERE c.state_id = k.id AND k.id <> k.keeper;
  `);
  await Schema.raw(`
    DELETE FROM ${STATES} s
    USING ${STATES} k
    WHERE k.country_id = s.country_id AND k.slug = s.slug AND k.id < s.id;
  `);

  await Schema.raw(`
    DELETE FROM ${CITIES} c
    USING ${CITIES} k
    WHERE k.country_id = c.country_id
      AND k.state_id IS NOT DISTINCT FROM c.state_id
      AND k.slug = c.slug
      AND k.id < c.id;
  `);
};

/**
 * Media can say where it was made. `media.location_id` points at a `locations` row — one per
 * place an artist picked (a Geoapify feature, deduplicated by its `place_id`) — which links into
 * the countries → states → cities hierarchy. That link is what future place pages
 * (`/media/madrid/photography`) filter on, so the hierarchy is hardened here as well:
 *
 * - every level gets a `slug`, unique within its parent — the stable key a URL resolves;
 * - `cities.state_id` may be null: geocoders omit the state for city-states and many countries,
 *   and a city that could not be stored is a city whose page silently misses media.
 */
const up = async () => {
  for (const table of HIERARCHY) {
    await Alter.table(table).addColumnIfNotExists('slug', 'VARCHAR(255)', { nullable: true });
    await backfillSlugs(table);
  }
  await mergeDuplicates();
  for (const table of HIERARCHY) {
    await Schema.raw(`ALTER TABLE ${table} ALTER COLUMN slug SET NOT NULL;`);
  }
  await Schema.raw(`ALTER TABLE ${CITIES} ALTER COLUMN state_id DROP NOT NULL;`);

  await Schema.table(COUNTRIES).createIndexIfNotExists('slug', {
    unique: true,
    name: 'uq_countries_slug',
  });
  await Schema.table(STATES).createIndexIfNotExists(['country_id', 'slug'], {
    unique: true,
    name: 'uq_states_country_id_slug',
  });
  // NULLS NOT DISTINCT (PG15+): two stateless "Monaco" cities in one country are one city.
  await Schema.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_cities_country_id_state_id_slug
    ON ${CITIES} (country_id, state_id, slug) NULLS NOT DISTINCT;
  `);
  // Future place pages resolve a bare `/media/{slug}` across every country.
  await Schema.table(CITIES).createIndexIfNotExists('slug');
  await Schema.table(STATES).createIndexIfNotExists('slug');

  await Schema.table(LOCATIONS).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('place_id', 255, { unique: true, nullable: false }),
    Column.string('formatted', 512, { nullable: false }),
    Column.string('name', 255, { nullable: false }),
    Column.string('result_type', 32, { nullable: true }),
    Column.double('latitude', { nullable: true }),
    Column.double('longitude', { nullable: true }),
    Column.foreignKey('country_id', COUNTRIES, 'id', { onDelete: 'SET NULL' }),
    Column.foreignKey('state_id', STATES, 'id', { onDelete: 'SET NULL' }),
    Column.foreignKey('city_id', CITIES, 'id', { onDelete: 'SET NULL' }),
  ]);
  await Schema.table(LOCATIONS).createIndexIfNotExists('country_id');
  await Schema.table(LOCATIONS).createIndexIfNotExists('state_id');
  await Schema.table(LOCATIONS).createIndexIfNotExists('city_id');

  if (!(await Alter.table(MEDIA).columnExist('location_id'))) {
    await Alter.table(MEDIA).foreignKeyAdd('location_id', LOCATIONS, 'id', {
      onDelete: 'SET NULL',
      constraintName: 'fk_media_location_id',
    });
  }
  await Schema.table(MEDIA).createIndexIfNotExists('location_id');
};

/**
 * Merged hierarchy rows are not un-merged, and `cities.state_id` stays nullable: restoring
 * NOT NULL would fail on the stateless cities written since.
 */
const down = async () => {
  await Schema.table(MEDIA).dropIndexIfExists('idx_media_location_id');
  await Alter.table(MEDIA).dropColumnIfExists('location_id');
  await Schema.table(LOCATIONS).dropIfExists();

  await Schema.table(STATES).dropIndexIfExists('idx_states_slug');
  await Schema.table(CITIES).dropIndexIfExists('idx_cities_slug');
  await Schema.table(CITIES).dropIndexIfExists('uq_cities_country_id_state_id_slug');
  await Schema.table(STATES).dropIndexIfExists('uq_states_country_id_slug');
  await Schema.table(COUNTRIES).dropIndexIfExists('uq_countries_slug');
  for (const table of HIERARCHY) {
    await Alter.table(table).dropColumnIfExists('slug');
  }
};

export { up, down };
