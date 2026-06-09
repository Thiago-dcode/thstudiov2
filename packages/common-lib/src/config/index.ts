import dotenv from 'dotenv'
dotenv.config()
import path from 'path';
import fs from 'fs';

//IMPORTANT: This file is not available for next.js middleware,
//So dont call this file from next.js middleware
let envFilePath = path.resolve(process.cwd(), '..', '..', '.env');

const config = (envPath?: string | undefined) => {
  envFilePath = envPath || envFilePath;
  // In containerized/production environments there is no physical .env file:
  // variables are injected directly into process.env (e.g. via compose env_file).
  // Only load from disk when the file actually exists; otherwise rely on process.env.
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath, quiet: true });
  }
  return {
    app: {
      api_key: process.env.APP_API_KEY || '',
      name: 'a11studio',
      url: process.env.APP_URL,
      env: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV?.toLowerCase() == 'production',
      sendErrorEmails: process.env.SEND_ERROR_EMAILS == '1',
      frontendUrls: process.env.APP_FRONTEND_URLS ? process.env.APP_FRONTEND_URLS.split(',') : [],
      allowedOrigins: process.env.APP_ALLOWED_ORIGINS ? process.env.APP_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()) : [],
    },
    api: {
      url: process.env.API_URL + '/api',
      name: 'api',
      port: process.env.API_PORT || 8080,
      v1Url: process.env.API_URL + '/api' + '/v1',
      maxTwofaAttempts: process.env.MAX_TWOFA_ATTEMPTS ? parseInt(process.env.MAX_TWOFA_ATTEMPTS) : 3,
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
    redis: {
      url: process.env.REDIS_URL,
    },
    mailing: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD,
      admins: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [],
      noreplyEmail: process.env.NOREPLY_EMAIL,
      contactEmail: process.env.CONTACT_EMAIL,
      supportEmail: process.env.SUPPORT_EMAIL,
      api_key: process.env.RESEND_API_KEY,
    },
    storage: {
      bucket: process.env.STORAGE_BUCKET,
      region: process.env.STORAGE_REGION,
      accessKeyId: process.env.STORAGE_ACCESS_KEY,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      signedUrlExpiration: process.env.STORAGE_SIGNED_URL_EXPIRATION ? parseInt(process.env.STORAGE_SIGNED_URL_EXPIRATION) : 3600,
      folder: process.env.STORAGE_FOLDER,
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY as string,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
    },
    paypal: {
      url: process.env.PAYPAL_URL as string,
      secretKey: process.env.PAYPAL_SECRET_KEY as string,
      clientId: process.env.PAYPAL_CLIENT_ID as string
    },

    encryption: {
      secret: process.env.ENCRYPTION_SECRET || 'secret',
    },
    llm: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL,
      organization: process.env.OPENAI_ORGANIZATION,
    },
  };
};
export { envFilePath, config };
