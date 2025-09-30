import { Injectable } from '@nestjs/common';
import { EnumType } from '@repo/database/schemas/database';
import { UserAuth } from 'src/v1/modules/auth/auth.types';

type RequestLanguage = EnumType<'LANGUAGE_CODE'>;
@Injectable()
export class RequestService {
  private _user: UserAuth | null;
  private _language: RequestLanguage | null;
  private _user_agent: string | null;
  private _ip_address: string | null;
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
}
