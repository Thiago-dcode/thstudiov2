import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { UserAuth } from '@repo/common-lib/types/auth';
import { Pagination } from '@repo/common-lib/types/response';
import { RequestLanguage, RequestLogContext, RequestStore } from '@repo/common-lib/types/request';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { requestLogContextOf } from './request-storage';



@Injectable()
export class RequestService {

  constructor(protected readonly storage: AsyncLocalStorage<RequestStore>) { }

  /**
   * Called once per request in the middleware to establish an isolated store. Api loggers
   * (`createApiLogger`) read its id and request context per line, and `apiLogConfig()` carries
   * the id into every job the request enqueues.
   */
  async run(callback: (self: RequestService) => void): Promise<void> {
    const requestId = await generateUUID();
    this.storage.run(
      { requestId, user: null, language: null, user_agent: null, method: null, ip_address: null, path: null, pagination: null, unattributed_app_call: false, bearer_token: null },
      () => callback(this),
    );
  }

  private get store(): RequestStore | undefined {
    return this.storage.getStore();
  }

  get requestId(): string | null {
    return this.store?.requestId ?? null;
  }

  /** The HTTP request's log context, or `null` outside one (see `requestLogContextOf`). */
  get log(): RequestLogContext | null {
    return requestLogContextOf(this.store);
  }

  get method(): string | null {
    return this.store?.method ?? null;
  }
  set method(method: string | null) {
    if (this.store) this.store.method = method;
  }
  get user(): UserAuth | null {
    return this.store?.user ?? null;
  }
  set user(user: UserAuth | null) {
    if (this.store) this.store.user = user;
  }

  get bearer_token(): string | null {
    return this.store?.bearer_token ?? null;
  }
  set bearer_token(token: string | null) {
    if (this.store) this.store.bearer_token = token;
  }

  get viewer(): UserAuth | null | undefined {
    return this.store?.viewer;
  }
  set viewer(viewer: UserAuth | null) {
    if (this.store) this.store.viewer = viewer;
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
    const store = this.store;
    if (!store) return null;
    return store.path_resolver ? store.path_resolver() : (store.path ?? null);
  }
  set path(path: string) {
    if (this.store) this.store.path = path;
  }
  /** See `RequestStore.path_resolver`: the middleware sets this so `path` is masked lazily. */
  set path_resolver(resolver: () => string | null) {
    if (this.store) this.store.path_resolver = resolver;
  }

  get unattributed_app_call(): boolean {
    return this.store?.unattributed_app_call ?? false;
  }
  set unattributed_app_call(value: boolean) {
    if (this.store) this.store.unattributed_app_call = value;
  }

  get pagination(): Pagination | null {
    return this.store?.pagination ?? null;
  }
  set pagination(pagination: Pagination | null) {
    if (this.store) this.store.pagination = pagination;
  }
}
