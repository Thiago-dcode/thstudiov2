import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import { s3PrivateStorageConfig } from '@repo/backend-lib/config/storage';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import type { CreateMediaUploadUrl } from '@repo/common-lib/types/media';

/**
 * Expiry for a presigned upload URL. Deliberately short and independent of
 * `S3StorageConfig.signedUrlExpiration` (1h, used for asset display links): this URL is a one-shot
 * write, not a link a page keeps around, and a shorter window shrinks how long a leaked URL stays
 * useful.
 */
const UPLOAD_URL_EXPIRATION_SECONDS = 15 * 60;

/** Every presigned upload lives under this prefix; the private bucket's lifecycle rule expires it. */
const UPLOADS_PREFIX = 'uploads';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Both key segments must be uuids. The DTOs already validate `upload_id`, but this is the one
 * place keys are built, so it refuses anything that could reshape the key itself — and
 * `deleteUser` deletes recursively, so a blank or malformed public id must never widen its prefix.
 */
const assertUuid = (value: string, what: string) => {
  if (!UUID_PATTERN.test(value)) {
    throw new BadRequestException(`Invalid ${what}`);
  }
};

/**
 * The single owner of presigned uploads (media, avatar, banner): issues the URL, then inspects,
 * reads, promotes or deletes what the browser PUT. Nothing else builds a temp key.
 *
 * The objects live in the PRIVATE bucket, never the media bucket: until they are claimed they are
 * unvalidated, unmoderated bytes, and the media bucket is the public CDN origin.
 *
 * Every method takes the caller's `userPublicId` and rebuilds the key from it, and clients only
 * ever hold the bare `uploadId` — so an upload id stolen from another session resolves under the
 * caller's own prefix, where nothing exists.
 */
@Injectable()
export class TempUploadService {
  /** Created on first use so the API can boot without PRIVATE_BUCKET until an upload happens. */
  private storage?: StorageService;

  private get privateStorage(): StorageService {
    this.storage ??= FactoryStorageService.create(s3PrivateStorageConfig());
    return this.storage;
  }

  private userPrefix(userPublicId: string): string {
    assertUuid(userPublicId, 'user id');
    return `${UPLOADS_PREFIX}/${userPublicId}/`;
  }

  /**
   * Extensionless on purpose: the client is handed only `uploadId`, so the key must be
   * rebuildable from the authenticated user alone. The served `ContentType` is re-derived from the
   * destination key when the object is promoted (`S3StorageService.promoteFrom`).
   */
  private key(userPublicId: string, uploadId: string): string {
    assertUuid(uploadId, 'upload id');
    return `${this.userPrefix(userPublicId)}${uploadId}`;
  }

  /** Presigned PUT bound to `size` bytes. Callers enforce their own per-type caps before this. */
  async createUploadUrl(
    userPublicId: string,
    size: number,
  ): Promise<CreateMediaUploadUrl> {
    const uploadId = await generateUUID();
    const uploadUrl = await this.privateStorage.getUploadUrl(
      this.key(userPublicId, uploadId),
      { contentLength: size, expireIn: UPLOAD_URL_EXPIRATION_SECONDS },
    );
    return {
      upload_url: uploadUrl,
      upload_id: uploadId,
      expires_in: UPLOAD_URL_EXPIRATION_SECONDS,
    };
  }

  /** Real size of the uploaded object, or `null` when nothing was uploaded under that id. */
  async head(
    userPublicId: string,
    uploadId: string,
  ): Promise<{ size: number } | null> {
    return await this.privateStorage.head(this.key(userPublicId, uploadId));
  }

  /**
   * Reads the upload into memory and deletes it. The size is re-checked against the real object:
   * the signed `ContentLength` binds the URL, not what a raw client may PUT to it.
   */
  async read(
    userPublicId: string,
    uploadId: string,
    maxBytes: number,
  ): Promise<Buffer> {
    const head = await this.head(userPublicId, uploadId);
    if (!head || head.size === 0) {
      throw new BadRequestException('Upload could not be found');
    }
    if (head.size > maxBytes) {
      await this.delete(userPublicId, uploadId);
      throw new BadRequestException('File exceeds the allowed size limit');
    }
    const key = this.key(userPublicId, uploadId);
    const buffer = await this.privateStorage.getBuffer(key);
    await this.privateStorage.delete(key);
    return buffer;
  }

  /** Copies the upload onto `toPath` in `destination` and deletes it here. `false` if the copy failed. */
  async promote(
    userPublicId: string,
    uploadId: string,
    destination: StorageService,
    toPath: string,
  ): Promise<boolean> {
    return await destination.promoteFrom(
      this.privateStorage,
      this.key(userPublicId, uploadId),
      toPath,
    );
  }

  async delete(userPublicId: string, uploadId: string): Promise<boolean> {
    return await this.privateStorage.delete(this.key(userPublicId, uploadId));
  }

  /** Every pending upload of one user — for account deletion. */
  async deleteUser(userPublicId: string): Promise<boolean> {
    return await this.privateStorage.deleteDirectory(
      this.userPrefix(userPublicId),
    );
  }
}
