import { initClient } from './lib/clients';
import { FullDatabaseConfig } from './lib/types';
export const init = (config: FullDatabaseConfig) => {
  return initClient(config);
};
