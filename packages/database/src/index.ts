import { initClient } from './lib/client';
import { DatabaseConfig } from './lib/utils/types';
export const init = async (config: DatabaseConfig) => {
  console.log('Initializing database...');
  return await initClient(config);
};
