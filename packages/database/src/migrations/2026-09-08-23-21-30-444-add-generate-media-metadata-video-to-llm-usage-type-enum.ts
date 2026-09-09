import { Schema } from '../lib/facades';

const up = async () => {
  await Schema.addEnumValue('LLM_USAGE_TYPE', 'GENERATE_MEDIA_METADATA_VIDEO');
};

const down = async () => {
  // PostgreSQL cannot drop a single enum value without recreating the type.
};

export { up, down };
