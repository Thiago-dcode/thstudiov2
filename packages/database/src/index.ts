import { initClient } from './lib/client';
import { DatabaseConfig } from '@repo/common-lib/types/database';
export const init = async (config: DatabaseConfig) => {
  console.log('Initializing database...');
  return await initClient(config);
};
