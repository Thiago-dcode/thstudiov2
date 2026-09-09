import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService } from "./storage.service";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { S3StorageConfig, StorageWriteInput } from "./types";

/**
 * Signed onto every presigned upload URL this service issues. A bucket lifecycle rule filtered
 * on this tag expires abandoned `__TEMP__` objects without needing a prefix rule — S3 lifecycle
 * prefix filters are literal strings with no wildcard support, and the temp key is nested per
 * user (`users/{publicId}/__TEMP__/{uploadId}`), so no single prefix rule could cover it.
 */
const TEMP_UPLOAD_TAG = 'temp=true';

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
    // Video. `mp4` is the only one the worker ever writes as a finished asset; the rest are
    // upload source keys (`.source.mov`), which are deleted once the transcode lands but must
    // still be labelled correctly while they exist. Without these entries a stored video is
    // served as `application/octet-stream` and `<video>` refuses to play it.
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    webm: 'video/webm',
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
     * @see {@link StorageService.getUploadUrl}. `ContentType` is fixed rather than taken from
     * the caller — a presigned PUT lets the browser send whatever bytes it likes regardless of
     * what we sign, but signing a fixed value at least keeps the *header* honest, and the
     * object's real served `ContentType` is re-derived from its final key by {@link move}, never
     * from anything set here.
     */
    public async getUploadUrl(
        path: string,
        config: { contentLength: number; expireIn: number },
    ): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: path,
            ContentType: 'application/octet-stream',
            ContentLength: config.contentLength,
            Tagging: TEMP_UPLOAD_TAG,
        });
        return await getSignedUrl(this.s3Client, command, {
            expiresIn: config.expireIn,
            // `getSignedUrl` otherwise "hoists" every header into the URL's query string so the
            // caller does not have to send it back at all — for most headers that's the point of
            // a presigned URL. `x-amz-tagging` is the documented exception (AWS SDK v3 issue
            // aws/aws-sdk-js-v3#3906): S3 requires it to arrive as a real request header, not a
            // query param, so it has to be pinned into `X-Amz-SignedHeaders` here and sent back
            // as a header by `uploadFileToStorage` — which is exactly what it already does.
            // Omitting this produces "AccessDenied: HeadersNotSigned: x-amz-tagging".
            unhoistableHeaders: new Set(['x-amz-tagging']),
        });
    }
    /**
     * @param config.expireIn - Custom expiration in **seconds**. Falls back to `S3StorageConfig.signedUrlExpiration`.
     */
    public async getUrl(path: string, config?: { expireIn?: number }): Promise<string> {
        //Resolve CDN
        if (this.config.cdnUrl) {
            // Percent-encode each segment (never the `/` separators). Keys built before filenames
            // were slugified can still contain spaces, parentheses or `#`, and interpolating those
            // raw produced a URL that `<img src>` tolerates but a CSS `url(...)` rejects outright —
            // taking the whole declaration with it. The presigned branch below already encodes.
            const encodedPath = path.split('/').map(encodeURIComponent).join('/');
            return `${this.config.cdnUrl}/${encodedPath}`
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
    /** Backed by {@link head} — a 404 there is "does not exist", anything else is a real error. */
    public async exists(path: string): Promise<boolean> {
        return (await this.head(path)) !== null;
    }
    public async head(path: string): Promise<{ size: number } | null> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.config.bucket,
                Key: path,
            });
            const result = await this.s3Client.send(command);
            return { size: result.ContentLength ?? 0 };
        } catch (error) {
            // S3 has no typed "not found" error class for HeadObject (unlike GetObject's
            // `NoSuchKey`) — a missing key surfaces as a plain 404, distinguishable only by
            // status code or the `NotFound` name the SDK assigns it.
            const httpStatusCode = (error as { $metadata?: { httpStatusCode?: number } })
                ?.$metadata?.httpStatusCode;
            const name = (error as { name?: string })?.name;
            if (httpStatusCode === 404 || name === 'NotFound') return null;
            throw error;
        }
    }
    public async move(fromPath: string, toPath: string): Promise<boolean> {
        try {
            // Copy to new location. `MetadataDirective: 'REPLACE'` + a fresh `ContentType`
            // derived from `toPath` (never copied from the source) matters most for the presigned
            // upload flow: the temp object was written with `Content-Type: application/octet-stream`
            // by the client, and this is the point where the real, key-derived type is applied —
            // objects are served from the CDN domain, so trusting a client-supplied type here would
            // be stored XSS. Also fixes the pre-existing SEO-rename caller, which relied on
            // `COPY` (the implicit default) and so silently carried the old key's Content-Type
            // whenever a rename changed extension-implying content (it doesn't today, but nothing
            // enforced that).
            //
            // `TaggingDirective: 'REPLACE'` with no `Tagging` value strips tags on copy rather
            // than the default `COPY`, for two reasons. Correctness: every presigned upload this
            // moves out of `__TEMP__` was written with `temp=true` (so the lifecycle rule can
            // find it) — without this, the PERMANENT object inherits that tag and the same rule
            // deletes real media a day later. Permissions: the default `COPY` directive also
            // requires `s3:GetObjectTagging` on the source, which callers of this service are not
            // guaranteed to have; `REPLACE` sidesteps that requirement entirely.
            const copyCommand = new CopyObjectCommand({
                Bucket: this.config.bucket,
                CopySource: `${this.config.bucket}/${fromPath}`,
                Key: toPath,
                MetadataDirective: 'REPLACE',
                ContentType: resolveContentType(toPath),
                Metadata: { 'x-content-type-options': 'nosniff' },
                TaggingDirective: 'REPLACE',
            });
            await this.s3Client.send(copyCommand);

            // Delete old location
            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.config.bucket,
                Key: fromPath,
            });
            await this.s3Client.send(deleteCommand);

            return true;
        } catch (error) {
            // Swallowed by design — callers treat `false` as "could not move" and decide what to
            // do next (e.g. `writeOriginalAndEnqueue` marks the media FAILED). But a bare `false`
            // gave no way to tell an IAM denial from a missing source from a transient network
            // error, which is exactly what made this failure opaque in practice.
            console.error(`S3StorageService.move failed: ${fromPath} -> ${toPath}`, error);
            return false;
        }
    }


} 