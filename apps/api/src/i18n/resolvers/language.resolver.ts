import { ExecutionContext } from "@nestjs/common";
import { I18nResolver } from "nestjs-i18n";
import { LANGUAGE_HEADER } from "@repo/common-lib/constants";

export  class LanguageResolver implements I18nResolver {
    constructor(){}
   async resolve(context: ExecutionContext) {
      const language = context.switchToHttp().getRequest().headers[LANGUAGE_HEADER];
     return language;
    }
}