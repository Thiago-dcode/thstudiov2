import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { UserAuth } from '@repo/common-lib/types/auth';
import { Pagination } from '@repo/common-lib/types/response';
import { RequestLanguage, RequestStore } from '@repo/common-lib/types/request';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';



@Injectable()
export class RequestService {

  constructor(protected readonly storage: AsyncLocalStorage<RequestStore>) { }

  /** Called once per request in the middleware to establish an isolated store. */
  async run(callback: (self: RequestService) => void): Promise<void> {
    this.storage.run(
      { requestId: await generateUUID(), user: null, language: null, user_agent: null, ip_address: null, path: null, pagination: null },
      () => {
        callback(this)
      },
    );
  }

  private get store(): RequestStore | undefined {
    return this.storage.getStore();
  }

  get requestId(): string | null {
    return this.store?.requestId ?? null;
  }
  get user(): UserAuth | null {
    return this.store?.user ?? null;
  }
  set user(user: UserAuth | null) {
    if (this.store) this.store.user = user;
  }

  get language(): RequestLanguage | null {
    return this.store?.language ?? null;
  }
  set language(language: RequestLanguage) {
    if (this.store) this.store.language = language;
  }

  get user_agent(): string | null {
    return this.store?.user_agent ?? null;
  }
  set user_agent(user_agent: string) {
    if (this.store) this.store.user_agent = user_agent;
  }

  get ip_address(): string | null {
    return this.store?.ip_address ?? null;
  }
  set ip_address(ip_address: string) {
    if (this.store) this.store.ip_address = ip_address;
  }

  get path(): string | null {
    return this.store?.path ?? null;
  }
  set path(path: string) {
    if (this.store) this.store.path = path;
  }

  get pagination(): Pagination | null {
    return this.store?.pagination ?? null;
  }
  set pagination(pagination: Pagination | null) {
    if (this.store) this.store.pagination = pagination;
  }
}
