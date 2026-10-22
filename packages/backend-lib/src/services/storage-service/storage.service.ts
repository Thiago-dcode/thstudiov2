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
     * `X-Amz-SignedHeaders` is `content-length;host;x-amz-tagging`: the signature binds the exact
     * body size (so the PUT can never exceed what was declared and capped) and a `temp=true` tag.
     * `Content-Type` is NOT signed — the client may send any value — so nothing may trust the
     * temp object's stored type: it is never served, and the real type is re-derived from the
     * destination key when the upload is promoted (`promoteFrom`).
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
    /** The bucket (or root) this instance reads and writes. */
    public abstract get bucket(): string;
    /**
     * Copies `fromPath` out of ANOTHER storage instance onto `toPath` here, then deletes the
     * source — `move` across buckets. Used to claim a presigned upload out of the private bucket.
     * `false` when the copy failed; a failed source delete after a good copy still returns `true`.
     */
    public abstract promoteFrom(source: StorageService, fromPath: string, toPath: string): Promise<boolean>;
}