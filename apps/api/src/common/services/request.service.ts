import { Injectable, Scope } from '@nestjs/common';
import { EnumType } from '@repo/database/schemas/database';
import { BaseUser } from 'src/v1/modules/users/users.types';

type RequestLanguage = EnumType<'LANGUAGE_CODE'>;
@Injectable({ scope: Scope.REQUEST })
export class RequestService {
  private _user: BaseUser;
  private _language: RequestLanguage;
  constructor() {}
  get user(): BaseUser {
    return this._user;
  }
  set user(user: BaseUser) {
    this._user = user;
  }
  get language(): RequestLanguage {
    return this._language;
  }
  set language(language: RequestLanguage) {
    this._language = language;
  }
}
