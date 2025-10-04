import { Injectable, NestMiddleware, Scope } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestService } from 'src/common/services/request.service';
import { ENUMS, DEFAULT_LANGUAGE } from '@repo/database/constants';
import { EnumType } from '@repo/database/schemas/database';
import {
  LANGUAGE_HEADER,
  REQUEST_START_TIME,
} from 'src/common/utils/constants';
const AVAILABLE_LANGUAGES = ENUMS.LANGUAGE_CODE;
@Injectable({ scope: Scope.REQUEST })
export class LanguageMiddleware implements NestMiddleware {
  constructor(private readonly requestService: RequestService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log("req.body", req.body);
    console.log("req.files", req.files);
    this.requestService.language = null;
    req.headers[REQUEST_START_TIME] = Date.now().toString();
    //Priority 1: Query Param
    const { lan }: { lan?: string } = req.query;
    let language: EnumType<'LANGUAGE_CODE'> | undefined =
      lan?.toUpperCase() as EnumType<'LANGUAGE_CODE'>;

    if (!language || !AVAILABLE_LANGUAGES.includes(language)) {
      //Priority 2: custom header
      language = req.headers[LANGUAGE_HEADER] as EnumType<'LANGUAGE_CODE'>;
      if (!language || !AVAILABLE_LANGUAGES.includes(language)) {
        //Priority 3: accept-language header
        const acceptLanguage = req.headers['accept-language'];
        if (acceptLanguage) {
          const primaryLanguage = acceptLanguage
            .split(',')[0]
            .split('-')[0]
            .toUpperCase();
          language = primaryLanguage as EnumType<'LANGUAGE_CODE'>;
        }
        if (!AVAILABLE_LANGUAGES.includes(language)) {
          //Priority 4: default language
          language = DEFAULT_LANGUAGE;
        }
      }
    }
    res.setHeader(LANGUAGE_HEADER, language);
    req.headers[LANGUAGE_HEADER] = language;
    this.requestService.language = language;

    next();
  }
}
