import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { UserAuth } from '@repo/common-lib/types/auth';
import { Pagination } from '@repo/common-lib/types/response';
import { RequestLanguage, RequestLogContext, RequestStore } from '@repo/common-lib/types/request';
import { LogConfig } from '@repo/backend-lib/services/log-service/types';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { runWithLogContext } from '@repo/backend-lib/services/log-service';



@Injectable()
export class RequestService {

  constructor(protected readonly storage: AsyncLocalStorage<RequestStore>) { }

  /**
   * Called once per request in the middleware to establish an isolated store. The log context
   * makes every logger in the request (with or without `logBinding()`) carry its id and context,
   * and every job it enqueues carry the id onward.
   */
  async run(callback: (self: RequestService) => void): Promise<void> {
    const requestId = await generateUUID();
    this.storage.run(
      { requestId, user: null, language: null, user_agent: null, method: null, ip_address: null, path: null, pagination: null, unattributed_app_call: false, bearer_token: null },
      () => {
        runWithLogContext({ id: requestId, request: () => this.log }, () => {
          callback(this)
        });
      },
    );
  }

  private get store(): RequestStore | undefined {
    return this.storage.getStore();
  }

  get requestId(): string | null {
    return this.store?.requestId ?? null;
  }

  /**
   * The request's log context, or `null` outside a request. Built field by field from an
   * allow-list, never by spreading the store: it holds `bearer_token` and the user's token/email.
   */
  get log(): RequestLogContext | null {
    const store = this.store;
    if (!store) return null;
    const user = store.user ?? store.viewer ?? null;
    return {
      id: store.requestId,
      method: store.method ?? null,
      path: this.path,
      ip_address: store.ip_address ?? null,
      user_agent: store.user_agent ?? null,
      user_id: user?.id ?? null,
      user_role: user?.role?.name ?? null,
      language: store.language ?? null,
      unattributed_app_call: store.unattributed_app_call ?? false,
    };
  }

  /**
   * The config every request-bound logger spreads in. Both are functions so each line reads the
   * current request, never one captured when the (shared) logger was built.
   */
  logBinding(): Pick<LogConfig, 'id' | 'request'> {
    return {
      id: () => this.requestId,
      request: () => this.log,
    };
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
