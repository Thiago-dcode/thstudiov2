"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.envFilePath = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
//IMPORTANT: This file is not available for next.js middleware,
//So dont call this file from next.js middleware
let envFilePath = path_1.default.resolve(process.cwd(), '..', '..', '.env');
exports.envFilePath = envFilePath;
const config = (envPath) => {
    exports.envFilePath = envFilePath = envPath || envFilePath;
    if (!fs_1.default.existsSync(envFilePath)) {
        throw new Error('Environment file not found');
    }
    dotenv_1.default.config({ path: envPath || envFilePath });
    return {
        app: {
            name: 'a11studio',
            url: process.env.APP_URL,
            env: process.env.NODE_ENV || 'development',
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
        mailing: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
            username: process.env.SMTP_USERNAME,
            password: process.env.SMTP_PASSWORD,
            admins: process.env.SMTP_ADMINS ? process.env.SMTP_ADMINS.split(',') : [],
        },
        storage: {
            bucket: process.env.STORAGE_BUCKET,
            region: process.env.STORAGE_REGION,
            accessKeyId: process.env.STORAGE_ACCESS_KEY,
            secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
            signedUrlExpiration: process.env.STORAGE_SIGNED_URL_EXPIRATION ? parseInt(process.env.STORAGE_SIGNED_URL_EXPIRATION) : 3600,
            folder: process.env.STORAGE_FOLDER,
        },
        encryption: {
            secret: process.env.ENCRYPTION_SECRET || 'secret',
        },
    };
};
exports.config = config;
