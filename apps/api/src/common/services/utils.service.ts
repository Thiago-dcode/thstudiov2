import { Inject, Injectable } from '@nestjs/common';
import { RequestService } from './request.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export default class Utils {
  constructor(
    private readonly requestService: RequestService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  public async cacheRemember(
    key: string,
    toRemember: Promise<object>,
    options: {
      append_language: boolean;
      ttl: number;
    } = {
      append_language: false,
      ttl: 1000 * 60 * 60 * 24,
    },
  ): Promise<object> {
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
}
