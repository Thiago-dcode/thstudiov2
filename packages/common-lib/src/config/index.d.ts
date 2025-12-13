declare let envFilePath: string;
declare const config: (envPath?: string | undefined) => {
    app: {
        name: string;
        url: string | undefined;
        env: string;
        isProduction: boolean;
        sendErrorEmails: boolean;
        frontendUrls: string[];
        allowedOrigins: string[];
    };
    api: {
        url: string;
        name: string;
        port: string | number;
        v1Url: string;
        maxTwofaAttempts: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    database: {
        client: string;
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    redis: {
        url: string | undefined;
    };
    mailing: {
        host: string | undefined;
        port: number;
        username: string | undefined;
        password: string | undefined;
        admins: string[];
    };
    storage: {
        bucket: string | undefined;
        region: string | undefined;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        signedUrlExpiration: number;
        folder: string | undefined;
    };
    stripe: {
        secretKey: string;
        webhookSecret: string;
    };
    paypal: {
        url: string;
        secretKey: string;
        clientId: string;
    };
    encryption: {
        secret: string;
    };
};
export { envFilePath, config };
//# sourceMappingURL=index.d.ts.map