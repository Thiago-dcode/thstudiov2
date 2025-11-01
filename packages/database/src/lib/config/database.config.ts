import {config} from '@repo/common-lib/config';
import { DatabaseConfig, DatabaseClient } from '@repo/common-lib/types/database';
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
