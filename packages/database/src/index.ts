import { initClient } from './lib/client';
import { DatabaseConfig } from './lib/types';
export const init = (config: DatabaseConfig) => {
  return initClient(config);
};
