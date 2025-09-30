import  dotenv from 'dotenv'
dotenv.config()
import  path from 'path';
import  fs from 'fs';
let envFilePath = path.resolve(process.cwd(),'..', '..', '.env');

 const config = (envPath?: string | undefined) => {
  envFilePath = envPath || envFilePath;
  if(!fs.existsSync(envFilePath)){
    throw new Error('Environment file not found');
  }
  dotenv.config({ path: envPath || envFilePath });
  return {
    app: {
      name: 'a11studio',
      url: process.env.APP_URL,
      env: process.env.NODE_ENV || 'development',
      sendErrorEmails: process.env.SEND_ERROR_EMAILS == '1',
      
    },
    api: {
      url: process.env.API_URL,
      name: 'api',
      port: process.env.API_PORT || 8080,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    database: {
      client: process.env.DB_CLIENT || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'thstudio',
    },
    mailing: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD,
      admins: process.env.SMTP_ADMINS ? process.env.SMTP_ADMINS.split(',') : [],
    },
  };
};

export { envFilePath ,config};
