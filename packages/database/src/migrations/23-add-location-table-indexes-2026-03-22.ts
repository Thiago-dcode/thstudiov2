import { Schema } from '../lib/facades';

const up = async () => {
  // States / cities - foreign key lookups and listings by country or state
  await Schema.table('states').createIndexIfNotExists('country_id');

  await Schema.table('cities').createIndexIfNotExists('country_id');
  await Schema.table('cities').createIndexIfNotExists('state_id');
};

const down = async () => {
  await Schema.table('cities').dropIndexIfExists('idx_cities_state_id');
  await Schema.table('cities').dropIndexIfExists('idx_cities_country_id');
  await Schema.table('states').dropIndexIfExists('idx_states_country_id');
};

export { up, down };
