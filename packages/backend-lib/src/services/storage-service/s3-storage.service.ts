import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService } from "./storage.service";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { S3StorageConfig, StorageWriteInput } from "./types";

/** Extension → Content-Type for objects we serve. Anything unknown is sent as a
 * non-renderable download rather than being guessed, so an unexpected extension can
 * never be served as HTML/JS from the CDN origin. */
const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    svg: 'application/octet-stream', // never image/svg+xml: SVG executes script
};

const resolveContentType = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase() ?? '';
    return CONTENT_TYPE_BY_EXTENSION[extension] ?? 'application/octet-stream';
};

const resolveWriteBody = (body: StorageWriteInput): Buffer => {
    if (Buffer.isBuffer(body)) return body;
    if (!body.buffer) {
        throw new Error(
            'File buffer is required for storage write. Ensure multer is using memory storage.',
        );
    }
    return body.buffer;
};

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
    public async write(body: StorageWriteInput, path: string): Promise<boolean> {
        const command = new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: path,
            Body: resolveWriteBody(body),
            // Derived from the stored key, never from the client-supplied `file.mimetype`.
            // Objects are served from the CDN domain, so echoing back an attacker's
            // Content-Type (e.g. `text/html`) would turn an upload into stored XSS.
            ContentType: resolveContentType(path),
            // Belt and braces: instructs browsers not to re-sniff a type we didn't set.
            Metadata: { 'x-content-type-options': 'nosniff' },
        });
        const result = await this.s3Client.send(command);
        return !!result;

    }
    public async writeAnGet(body: StorageWriteInput, path: string) {
        const result = await this.write(body, path);
        if (!result) return null;

        return await this.getUrl(path);
    }
    /**
     * @param config.expireIn - Custom expiration in **seconds**. Falls back to `S3StorageConfig.signedUrlExpiration`.
     */
    public async getUrl(path: string, config?: { expireIn?: number }): Promise<string> {
        //Resolve CDN
        if (this.config.cdnUrl) {

            return `${this.config.cdnUrl}/${path}`
        }
        const command = new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: path,
        });
        const url = await getSignedUrl(this.s3Client, command, {
            expiresIn: config?.expireIn ?? this.config.signedUrlExpiration,
        });
        return url;
    }
    public async getBuffer(path: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: path,
        });
        const result = await this.s3Client.send(command);
        const bytes = await result.Body?.transformToByteArray();
        if (!bytes) {
            throw new Error(`Could not read object at ${path}`);
        }
        return Buffer.from(bytes);
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
    /**
     * Recursively deletes all objects under the given prefix (directory).
     * Handles pagination via `IsTruncated` to support prefixes with >1000 objects.
     */
    public async deleteDirectory(prefix: string): Promise<boolean> {
        try {
            let isTruncated = true;
            let continuationToken: string | undefined;

            while (isTruncated) {
                const listCommand = new ListObjectsV2Command({
                    Bucket: this.config.bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                });
                const listed = await this.s3Client.send(listCommand);

                if (!listed.Contents || listed.Contents.length === 0) break;

                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: this.config.bucket,
                    Delete: {
                        Objects: listed.Contents.map(({ Key }) => ({ Key })),
                    },
                });
                await this.s3Client.send(deleteCommand);

                isTruncated = listed.IsTruncated ?? false;
                continuationToken = listed.NextContinuationToken;
            }

            return true;
        } catch {
            return false;
        }
    }

    public async list(path: string): Promise<File[]> {
        throw new Error('Not implemented ' + path);
    }
    public async exists(path: string): Promise<boolean> {
        throw new Error('Not implemented ' + path);
    }
    public async move(fromPath: string, toPath: string): Promise<boolean> {
        try {
            // Copy to new location
            const copyCommand = new CopyObjectCommand({
                Bucket: this.config.bucket,
                CopySource: `${this.config.bucket}/${fromPath}`,
                Key: toPath,
            });
            await this.s3Client.send(copyCommand);

            // Delete old location
            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.config.bucket,
                Key: fromPath,
            });
            await this.s3Client.send(deleteCommand);

            return true;
        } catch {
            return false;
        }
    }


} 