import { Schema } from '../lib/facades';

const up = async () => {
  await Schema.addEnumValue('NOTIFICATION_TYPE', 'FAILED_GENERATE_MEDIA_METADATA');
};

const down = async () => {
  // PostgreSQL cannot drop a single enum value without recreating the type.
};

export { up, down };
