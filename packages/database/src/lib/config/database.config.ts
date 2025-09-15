import config from '@repo/backend-lib/config';
import { DatabaseConfig, DatabaseClient } from '../constants/types/database';
export const getDatabaseConfig = (): DatabaseConfig => {
    const dbConfig = config().database;
  return {
    client: dbConfig.client as DatabaseClient,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
  };
};
