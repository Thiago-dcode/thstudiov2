import { StorageWriteInput } from './types';

export abstract class StorageService {
    public abstract setup(): Promise<void>;
    public abstract write(body: StorageWriteInput, path: string): Promise<boolean>;
    public abstract writeAnGet(body: StorageWriteInput, path: string): Promise<string|null>;
    /**
     * @param config.expireIn - Custom expiration in **seconds**. Implementations should fall back to their default expiration when omitted.
     */
    public abstract getUrl(path: string, config?: {
        expireIn?: number
    }): Promise<string>;
    /**
     * A presigned PUT URL a browser can upload straight to, bypassing our own server entirely.
     *
     * The signature binds `contentLength` and a fixed `Content-Type` (never the caller's own,
     * which would let the browser choose what gets stored) plus a `temp=true` tag so a bucket
     * lifecycle rule can expire abandoned uploads without a cron job walking every user's prefix.
     * The caller must send back exactly the headers that were signed — `Content-Type`,
     * `Content-Length` and `x-amz-tagging` — or S3 rejects the PUT with 403.
     *
     * @param config.expireIn - Expiry in **seconds**. Callers should pass a short window; this
     * is a one-shot upload URL, not a long-lived asset link, so it should not fall back to
     * `S3StorageConfig.signedUrlExpiration`.
     */
    public abstract getUploadUrl(path: string, config: {
        contentLength: number;
        expireIn: number;
    }): Promise<string>;
    public abstract getBuffer(path: string): Promise<Buffer>;
    public abstract read(path: string): Promise<File>;
    public abstract delete(path: string): Promise<boolean>;
    public abstract deleteDirectory(prefix: string): Promise<boolean>;
    public abstract list(path: string): Promise<File[]>;
    public abstract exists(path: string): Promise<boolean>;
    /** Object metadata without downloading its body. `null` when the object does not exist. */
    public abstract head(path: string): Promise<{ size: number } | null>;
    public abstract move(fromPath: string, toPath: string): Promise<boolean>;
}