import { Schema } from '../lib/facades';

const up = async () => {
  await Schema.addEnumValue('CATEGORY_TYPE', 'TECHNIQUE');
};

const down = async () => {
  // PostgreSQL cannot drop a single enum value without recreating the type.
};

export { up, down };
