import { Inject, Injectable } from '@nestjs/common';
import { RequestService } from './request.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { EnumType } from '@repo/common-lib/constants/enums';
import { addMonths, addYears } from 'date-fns';

@Injectable()
export default class Utils {
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
    const cached = (await this.cacheManager.get(_key)) as string;
    if (cached) {
      return JSON.parse(cached);
    }
    const result = await toRemember;
    this.cacheManager.set(key, JSON.stringify(result), options.ttl);
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
}
