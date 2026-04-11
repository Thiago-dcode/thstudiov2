import { S3StorageService } from "./s3-storage.service";
import { StorageConfig } from "./types";

export class FactoryStorageService {
    public static create(config: StorageConfig) {
        switch(config.driver){
                case 's3':
                    return new S3StorageService(config);
                    default:
                        throw new Error('Storage service not implemented');
        }
    }
}