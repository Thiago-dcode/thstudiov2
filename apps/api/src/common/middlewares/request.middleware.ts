import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestService } from 'src/common/services/request.service';
import { ENUMS } from '@repo/common-lib/constants/enums';
import { EnumType } from '@repo/common-lib/constants/enums';
import { getAcceptLanguage } from '@repo/common-lib/utils/get-accept-language';
import {
  LANGUAGE_HEADER,
  REQUEST_START_TIME,
  DEFAULT_LANGUAGE,
  USER_AGENT_HEADER,
  IP_ADDRESS_HEADER,
} from '@repo/common-lib/constants/constants';
const AVAILABLE_LANGUAGES = ENUMS.LANGUAGE_CODE;

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  constructor(private readonly requestService: RequestService) { }

  async use(req: Request, res: Response, next: NextFunction) {
    await this.requestService.run(() => {
      this.requestService.path = req.baseUrl;
      req.headers[REQUEST_START_TIME] = Date.now().toString();

      //Priority 1: Query Param
      const { lan }: { lan?: string } = req.query;
      let language: EnumType<'LANGUAGE_CODE'> | undefined | null =
        lan?.toUpperCase() as EnumType<'LANGUAGE_CODE'>;

      if (!language || !AVAILABLE_LANGUAGES.includes(language)) {
        //Priority 2: custom header
        language = req.headers[LANGUAGE_HEADER] as EnumType<'LANGUAGE_CODE'>;
        if (!language || !AVAILABLE_LANGUAGES.includes(language)) {
          //Priority 3: accept-language header
          language = getAcceptLanguage(
            req.headers?.['accept-language'],
          ) as EnumType<'LANGUAGE_CODE'>;
          if (!language || !AVAILABLE_LANGUAGES.includes(language)) {
            //Priority 4: default language
            language = DEFAULT_LANGUAGE;
          }
        }
      }

      res.setHeader(LANGUAGE_HEADER, language);
      req.headers[LANGUAGE_HEADER] = language;
      this.requestService.language = language;
      this.requestService.user_agent =
        req.get(USER_AGENT_HEADER) || req.get('user-agent') || '-';
      this.requestService.ip_address =
        req.get(IP_ADDRESS_HEADER) || req.ip || req.get('x-forwarded-for') || '-';

      next();
    });
  }
}
