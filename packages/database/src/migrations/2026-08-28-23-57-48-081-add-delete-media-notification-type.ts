import { Schema } from '../lib/facades';

const up = async () => {
  await Schema.addEnumValue('NOTIFICATION_TYPE', 'DELETE_MEDIA');
};

const down = async () => {
  // PostgreSQL cannot drop a single enum value without recreating the type.
};

export { up, down };
