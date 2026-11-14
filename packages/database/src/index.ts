import { getClient, initClient, killClient } from './lib/client';
import { DatabaseConfig } from '@repo/common-lib/types/database';
export const init = async (config: DatabaseConfig) => {
  console.log('Initializing database...');
  return await initClient(config);
};

export { getClient, killClient };
