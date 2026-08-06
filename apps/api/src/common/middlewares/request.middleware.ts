import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  APP_TOKEN_HEADER,
} from '@repo/common-lib/constants/constants';
const AVAILABLE_LANGUAGES = ENUMS.LANGUAGE_CODE;

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  constructor(
    private readonly requestService: RequestService,
    private readonly configService: ConfigService,
  ) { }

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

      // The custom `x-app-user-agent` / `x-app-ip-address` headers exist so our own
      // Next.js server can forward the *end user's* identity when it proxies a call
      // (otherwise every request would look like it came from the web container).
      //
      // They must only be honoured for that trusted caller. Any client can set them,
      // and `user_agent` + `ip_address` are what UserAuthDevicesService matches on to
      // decide a device is already trusted — so honouring them unconditionally let an
      // attacker with a stolen password replay a victim's trusted device and skip 2FA.
      const appToken = req.get(APP_TOKEN_HEADER);
      const expectedAppToken = this.configService.get<string>('app.token');
      const isTrustedCaller =
        !!expectedAppToken && appToken === expectedAppToken;

      this.requestService.user_agent =
        (isTrustedCaller ? req.get(USER_AGENT_HEADER) : undefined) ||
        req.get('user-agent') ||
        '-';
      // `req.ip` already resolves X-Forwarded-For correctly via `trust proxy` (main.ts).
      this.requestService.ip_address =
        (isTrustedCaller ? req.get(IP_ADDRESS_HEADER) : undefined) ||
        req.ip ||
        '-';

      next();
    });
  }
}
