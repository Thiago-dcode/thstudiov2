import { Injectable } from '@nestjs/common';
import { EnumType } from '@repo/common-lib/constants/enums';
import { UserAuth } from '@repo/common-lib/types/auth';
import { Pagination } from '@repo/common-lib/types/response';

type RequestLanguage = EnumType<'LANGUAGE_CODE'>;
@Injectable()
export class RequestService {
  private _user: UserAuth | null;
  private _language: RequestLanguage | null;
  private _user_agent: string | null;
  private _ip_address: string | null;
  private _pagination: Pagination | null = null;
  constructor() {}
  get user(): UserAuth {
    return this._user;
  }
  set user(user: UserAuth) {
    this._user = user;
  }
  get language(): RequestLanguage {
    return this._language;
  }
  set language(language: RequestLanguage) {
    this._language = language;
  }
  get user_agent(): string | null {
    return this._user_agent;
  }
  set user_agent(user_agent: string) {
    this._user_agent = user_agent;
  }
  get ip_address(): string | null {
    return this._ip_address;
  }
  set ip_address(ip_address: string) {
    this._ip_address = ip_address;
  }
  set pagination(pagination: Pagination | null) {
    this._pagination = pagination;
  }
  get pagination() {
    return this._pagination;
  }

  cleanUp() {
    this._user = null;
    this._language = null;
    this._user_agent = null;
    this._ip_address = null;
    this._pagination = null;
  }
}
