export type StorageServiceDriverType = 's3' | 'file';

export type S3StorageConfig = {
    driver: 's3';
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    signedUrlExpiration: number;
    cdnUrl?:string;
}

export type FileStorageConfig = {
    driver: 'file';
    folder: string;
}

export type StorageConfig = S3StorageConfig | FileStorageConfig;