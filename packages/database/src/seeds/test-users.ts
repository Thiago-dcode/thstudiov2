/**
 * Random test users for local/geo and category filtering (e.g. artists index).
 *
 * Prerequisites: run the default seed first so `categories` exist (`pnpm dbcli db:seed`).
 *
 * Usage:
 *   pnpm dbcli db:seed -n test-users
 *
 * Count (any positive integer, e.g. 5 or 300):
 *   SEED_TEST_USER_COUNT=300 pnpm dbcli db:seed -n test-users
 *
 * Re-running may fail on unique username/email; use a fresh DB or delete seeded rows first.
 */

import { hash } from '@repo/common-lib/utils/hash';
import { LogService } from '@repo/backend-lib/services/log-service';
import { Query } from '../lib/facades';

/** Representative coordinates + address text for geo filters (withinRadius / orderByDistance). */
export type SeedLocationPreset = {
  key: string;
  formated_address: string;
  street: string;
  city: string;
  state: string | null;
  zip: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
};

export const SEED_LOCATIONS: readonly SeedLocationPreset[] = [
  {
    key: 'a_coruna',
    formated_address: 'Praza de María Pita, 1, 15001 A Coruña, Spain',
    street: 'Praza de María Pita, 1',
    city: 'A Coruña',
    state: 'Galicia',
    zip: '15001',
    country: 'Spain',
    country_code: 'ES',
    latitude: 43.3623,
    longitude: -8.4115,
  },
  {
    key: 'madrid',
    formated_address: 'Puerta del Sol, 1, 28013 Madrid, Spain',
    street: 'Puerta del Sol, 1',
    city: 'Madrid',
    state: 'Comunidad de Madrid',
    zip: '28013',
    country: 'Spain',
    country_code: 'ES',
    latitude: 40.4168,
    longitude: -3.7038,
  },
  {
    key: 'barcelona',
    formated_address: 'Plaça de Catalunya, 1, 08002 Barcelona, Spain',
    street: 'Plaça de Catalunya, 1',
    city: 'Barcelona',
    state: 'Catalonia',
    zip: '08002',
    country: 'Spain',
    country_code: 'ES',
    latitude: 41.3851,
    longitude: 2.1734,
  },
  {
    key: 'paris',
    formated_address: 'Pl. du Trocadéro et du 11 Novembre, 75016 Paris, France',
    street: 'Pl. du Trocadéro et du 11 Novembre',
    city: 'Paris',
    state: 'Île-de-France',
    zip: '75016',
    country: 'France',
    country_code: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    key: 'london',
    formated_address: 'Westminster, London SW1A 1AA, UK',
    street: 'Parliament Square',
    city: 'London',
    state: 'England',
    zip: 'SW1A 1AA',
    country: 'United Kingdom',
    country_code: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
  },
] as const;

export type GeneratedTestUserSeed = {
  /** Use after hashing for `users.password`. */
  plainPassword: string;
  user: Record<string, string | number | boolean | null>;
  address: SeedLocationPreset;
};


/**
 * Build `count` synthetic user rows (not persisted). Address city is chosen at random from {@link SEED_LOCATIONS}.
 */
 function generateTestUserSeeds(
  count: number,
  faker:any
): GeneratedTestUserSeed[] {
  if (!Number.isFinite(count) || count < 1) {
    throw new Error('generateTestUserSeeds: count must be a positive integer');
  }

  const rows: GeneratedTestUserSeed[] = [];
  for (let i = 0; i < count; i++) {
    const suffix = `${i}_${faker.string.alphanumeric(12)}`;
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const profession = faker.person.jobTitle().slice(0, 100);

    rows.push({
      plainPassword: faker.internet.password({ length: 16, memorable: true }),
      user: {
        public_id: faker.string.uuid(),
        name: first,
        surname: last,
        username: `seed_${suffix}`,
        email: `seed.${suffix}@example.test`,
        biography: faker.lorem.paragraphs({ min: 1, max: 3 }),
        short_biography: faker.lorem.sentence().slice(0, 500),
        profession,
        email_validated: true,
        is_active: true,
        banned: false,
        funnel_step: 1,
        number_email_validations_sent: 0,
        twofa_enabled: false,
        twofa_attempts: 0,
        username_reset_count: 0,
        password_reset_count: 0,
        /** Matches migration seed: ARTIST = 3 */
        role_id: 3,
      },
      address: faker.helpers.arrayElement([...SEED_LOCATIONS]),
    });
  }
  return rows;
}

/**
 * Reads `process.env.SEED_TEST_USER_COUNT`. Any positive integer is allowed (e.g. 5, 100, 300).
 * Default: 100.
 */
export function getSeedUserCountFromEnv(): number {
  const raw = process.env.SEED_TEST_USER_COUNT;
  if (raw === undefined || raw.trim() === '') {
    return 100;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(
      'SEED_TEST_USER_COUNT must be a positive integer (e.g. 5, 100, 300)',
    );
  }
  return n;
}

export const main = async () => {
  const { faker } = await import('@faker-js/faker');
  const count = 1000;
  const categoryRows = await Query.table('categories').select(['id']).get<
    { id: number }[]
  >();

  if (!categoryRows?.length) {
    throw new Error(
      'No categories found. Run the default seed (`db:seed`) before test-users.',
    );
  }

  const categoryIds = categoryRows.map((r) => r.id);
  const maxPick = Math.min(5, categoryIds.length);
  const seeds = generateTestUserSeeds(count,faker);

  for (const seed of seeds) {
    const passwordHash = await hash(seed.plainPassword);
    const userRow = { ...seed.user, password: passwordHash };

    const { id: userId } = await Query.table('users').insertAndGet(
      Object.keys(userRow),
      Object.values(userRow),
      ['id'],
    );

    const a = seed.address;
    await Query.table('addresses').insert(
      [
        'formated_address',
        'street',
        'city',
        'state',
        'zip',
        'country',
        'country_code',
        'latitude',
        'longitude',
        'user_id',
      ],
      [
        a.formated_address,
        a.street,
        a.city,
        a.state,
        a.zip,
        a.country,
        a.country_code,
        a.latitude,
        a.longitude,
        userId,
      ],
    );

    const nCats = faker.number.int({ min: 1, max: maxPick });
    const picks = faker.helpers.arrayElements(categoryIds, nCats);
    for (const categoryId of picks) {
      await Query.table('user_categories').insert(
        ['user_id', 'category_id'],
        [userId, categoryId],
      );
    }
  }

  await LogService.flush();
};
