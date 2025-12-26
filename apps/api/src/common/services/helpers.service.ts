import { Inject, Injectable } from '@nestjs/common';
import { RequestService } from './request.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { EnumType } from '@repo/common-lib/constants/enums';
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

@Injectable()
export class Helpers {
  constructor(
    private readonly requestService: RequestService,
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
}
