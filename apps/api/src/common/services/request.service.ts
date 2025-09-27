import { Injectable } from '@nestjs/common';
import { EnumType } from '@repo/database/schemas/database';
import { BaseUser } from 'src/v1/modules/users/users.types';

type RequestLanguage = EnumType<'LANGUAGE_CODE'>;
@Injectable()
export class RequestService {
  private _user: BaseUser | null;
  private _language: RequestLanguage | null;
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
