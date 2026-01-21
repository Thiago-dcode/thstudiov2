import { HttpException, Inject, Injectable } from '@nestjs/common';
import { RequestService } from './request.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ENUMS, EnumType } from '@repo/common-lib/constants/enums';
import { addMonths, addYears } from 'date-fns';
import {
  LogLevel,
  LogOptions,
} from '@repo/backend-lib/services/log-service/types';
import { FactoryMailService } from '@repo/backend-lib/services/mail-service/factory';
import { mailingConfig, mailingDriver } from 'src/config/mailling';
import { FactoryViewService } from '@repo/backend-lib/services/view-service/factory';
import { viewPath } from '../utils';
import { VIEW_ENGINE } from '../utils/constants';
import { Error500Mail } from '../mails/error-500.mail';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { s3StorageConfig } from 'src/config/storage';
import { CompressService } from '@repo/backend-lib/services/compress-service/base';

@Injectable()
export class Helpers {
  constructor(
    private readonly requestService: RequestService,
    private readonly storageService: StorageService,
    private readonly compressService: CompressService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  public async cacheRemember<T>(
    key: string,
    toRemember: Promise<T>,
    options: {
      append_language: boolean;
      ttl: number;
    } = {
      append_language: false,
      ttl: 1000 * 60 * 60 * 24,
    },
  ): Promise<T> {
    let _key = key;
    if (options.append_language) {
      _key += `-${this.requestService.language}`;
    }
    const cached = await this.cacheManager.get(_key);
    if (cached) {
      console.log('CACHE HIT', _key);
      return JSON.parse(cached as string);
    }
    const result = await toRemember;
    console.log('CACHE MISS', _key);
    await this.cacheManager.set(_key, JSON.stringify(result), options.ttl);
    return result;
  }

  public async deleteCached(
    key: string,
    options?: {
      appended_language?: boolean;
    },
  ) {
    if (!options.appended_language) {
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

  public static async callback500ErrorMail(
    level: LogLevel,
    message: string,
    options?: LogOptions,
  ) {
    //Send a email to admin emails
    console.log('CALLBACK CALLED FOR ERROR 500', level, message);
    const mailService = FactoryMailService.createMailService(
      mailingDriver,
      mailingConfig,
    );
    const viewService = FactoryViewService.createViewService(VIEW_ENGINE, {
      basePath: viewPath(''),
    });
    //avoid to block the callback
    mailService.send(new Error500Mail(viewService, message, options));
  }

  public async deleteAsset(path: string) {
    return await this.storageService.delete(path);
  }
  public async getAsset(path: string) {
    let asset = (await this.cacheManager.get(path)) as string;
    if (!asset) {
      asset = await this.storageService.getUrl(path);
      await this.cacheManager.set(
        path,
        asset,
        s3StorageConfig.signedUrlExpiration * 900, //Substract 10% to avoid possible s3 404
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
    const targetSize = (targetSizeMb > 0 ? targetSizeMb : 1) * 1024;
    const resultCompress = await this.compressService.optimizeImageToWebp(
      asset,
      targetQuality ?? 90,
      asset.size > targetSize ? targetSize : asset.size,
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
