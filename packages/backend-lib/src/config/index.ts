import * as dotenv from 'dotenv'
dotenv.config()
import path from 'path';

// Load .env from project root (3 levels up from this file)
const defaultEnvPath = path.resolve(__dirname, '../../.env');

export default (envPath?: string | undefined) => {
  dotenv.config({ path: envPath || defaultEnvPath });
  return {
    apiGateway: {
      name: process.env.API_GATEWAY_NAME,
      port: process.env.API_GATEWAY_PORT,
    },
    mediaService: {
      name: process.env.MEDIA_SERVICE_NAME,
      port: process.env.MEDIA_SERVICE_PORT,
    },
    database: {
      client: process.env.DB_CLIENT || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'thstudio',
    },
  };
};

export const envFilePath = defaultEnvPath;
