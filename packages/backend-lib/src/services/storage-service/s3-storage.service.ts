import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService } from "./storage.service";
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
  } from '@aws-sdk/client-s3';
import { S3StorageConfig } from "./types";

export class S3StorageService extends StorageService {
    private s3Client: S3Client;
    constructor(protected readonly config: S3StorageConfig) {
        super();
        this.s3Client = new S3Client({
            region: this.config.region,
            credentials: {
                accessKeyId: this.config.accessKeyId,
                secretAccessKey: this.config.secretAccessKey,
            },
        });
    }
    public async setup(): Promise<void> {
        return Promise.resolve();
    }
    public async write(file: Express.Multer.File, path: string): Promise<boolean> {
        const command = new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: path,
            Body: file.buffer,
            ContentType: file.mimetype,
          });
            const result = await this.s3Client.send(command);
            return !!result;
         
    }
    public async writeAnGet(file: Express.Multer.File, path: string){
       const result = await this.write(file,path);
       if(!result) return null;

       return await this.getUrl(path);
    }
    /**
     * @param config.expireIn - Custom expiration in **seconds**. Falls back to `S3StorageConfig.signedUrlExpiration`.
     */
    public async getUrl(path: string, config?: { expireIn?: number }): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: path,
          });
            const url = await getSignedUrl(this.s3Client, command, {
              expiresIn: config?.expireIn ?? this.config.signedUrlExpiration,
            });
            return url;
    }
    public async read(path: string): Promise<File> {
        
        throw new Error('Not implemented ' + path);
    }
    public async delete(path: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.config.bucket,
                Key: path,
              });
                await this.s3Client.send(command);
                return true;
        } catch (error) {
          
            return false;
        }
    }
    public async list(path: string): Promise<File[]> {
        throw new Error('Not implemented ' + path);
    }
    public async exists(path: string): Promise<boolean> {
        throw new Error('Not implemented ' + path);
    }


} 