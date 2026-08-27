import { HttpException, Inject, Injectable } from '@nestjs/common';
import { RequestService } from './request.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ENUMS, EnumType } from '@repo/common-lib/constants/enums';
import { addMonths, addYears } from 'date-fns';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { s3StorageConfig } from '@repo/backend-lib/config/storage';
import { CompressService } from '@repo/backend-lib/services/compress-service/base';

@Injectable()
export class Helpers {
  constructor(
    private readonly requestService: RequestService,
    private readonly storageService: StorageService,
    private readonly compressService: CompressService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  public async cacheRemember<T>(
    key: string,
    /**
     * Value producer. Prefer a factory `() => Promise<T>` so the work only runs on a cache MISS;
     * an already-started `Promise<T>` is still accepted (legacy callers) but runs even on a hit.
     */
    toRemember: Promise<T> | (() => Promise<T> | T),
    options: {
      append_language?: boolean;
      ttl: number;
    } = {
        append_language: false,
        ttl: 1000 * 60 * 60 * 24,
      },
  ): Promise<T> {
    let _key = key;
    if (options?.append_language) {
      _key += `-${this.requestService.language}`;
    }
    const cached = await this.cacheManager.get(_key);
    if (cached) {
      return JSON.parse(cached as string);
    }
    const result = await (typeof toRemember === 'function'
      ? (toRemember as () => Promise<T> | T)()
      : toRemember);
    await this.cacheManager.set(_key, JSON.stringify(result), options.ttl);
    return result;
  }

  public async deleteCached(
    key: string,
    options?: {
      appended_language?: boolean;
    },
  ) {
    if (!options?.appended_language) {
      await this.cacheManager.del(key);
    } else {
      await Promise.all(
        ENUMS.LANGUAGE_CODE.map((lan) =>
          this.cacheManager.del(`${key}-${lan}`),
        ),
      );
    }
  }
  public async deleteManyCached(keys: string[]) {
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }

  /** Clears cached signed URL for a storage path without deleting the file. */
  public async invalidateAssetCache(path?: string | null): Promise<void> {
    if (!path) return;
    await this.cacheManager.del(path);
  }

  public getNextBillingDate(billingType: EnumType<'BILLING_TYPE'>) {
    const now = new Date();
    switch (billingType) {
      case 'LIFETIME':
        return addYears(now, 10);
      case 'YEARLY':
        return addYears(now, 1);
      case 'QUARTERLY':
        return addMonths(now, 3);
      case 'MONTHLY':
        return addMonths(now, 1);
    }
  }

  public async deleteAsset(path?: string) {
    if (!path) return;
    return await Promise.all([this.storageService.delete(path), this.cacheManager.del(path)]);
  }

  public async moveAsset(from: string, to: string): Promise<void> {
    const moved = await this.storageService.move(from, to);
    if (!moved) {
      throw new HttpException(
        `An error ocurred moving asset: <<${from}>> → <<${to}>>`,
        500,
      );
    }
    // Only invalidate the old key once the move is confirmed.
    await this.cacheManager.del(from);
  }
  /**
   * @param config.expireIn - Custom signed-URL expiration in **seconds**. Falls back to `s3StorageConfig.signedUrlExpiration`.
   */
  public async getAsset(path?: string, config?: { expireIn?: number }) {
    if (!path) return '';
    const expireIn = config?.expireIn ?? s3StorageConfig.signedUrlExpiration;

    let asset = (await this.cacheManager.get(path)) as string;
    if (!asset) {
      asset = await this.storageService.getUrl(path, { expireIn });
      await this.cacheManager.set(
        path,
        asset,
        expireIn * 950, //Substract 5% to avoid possible s3 404
      );
    }
    return asset;
  }
  public async setAsset({
    asset,
    targetSizeMb,
    path,
    targetQuality,
  }: {
    asset: Express.Multer.File;
    path: string;
    targetSizeMb: number;
    targetQuality?: number;
  }) {
    //Compress
    const targetSize = (targetSizeMb > 0 ? targetSizeMb : 1) * 1024 * 1024;
    const resultCompress = await this.compressService.optimizeImageToWebp(
      asset,
      asset.size > targetSize ? targetSize : asset.size,
      targetQuality ?? 90,
    );
    asset.buffer = resultCompress.buffer;

    const [result] = await Promise.all([
      this.storageService.write(asset, path),
      this.cacheManager.del(path),
    ]);
    if (!result) {
      throw new HttpException(
        `An error ocurred during asset storage: <<${path}>>`,
        500,
      );
    }
    return path;
  }

}
