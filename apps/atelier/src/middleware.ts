import { NextRequest, NextResponse } from "next/server";
import { ENUMS } from "@repo/common-lib/constants/enums";
import { EnumType } from "@repo/common-lib/constants/enums";
import { LANGUAGE_HEADER, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from "@repo/common-lib/constants";
import { getAcceptLanguage } from "@repo/common-lib/utils/get-accept-language";

const AVAILABLE_LANGUAGES = ENUMS.LANGUAGE_CODE;

const middleware = (req: NextRequest, res: NextResponse) => {

  const requestCookies = req.cookies;
  //Priority 1: Cookie
  let language : EnumType<'LANGUAGE_CODE'> | undefined | null = requestCookies.get(LANGUAGE_COOKIE_NAME)?.value as EnumType<'LANGUAGE_CODE'>;
  if(!language || !AVAILABLE_LANGUAGES.includes(language)) {
    //Priority 2: custom header
    language = req.headers.get(LANGUAGE_HEADER) as EnumType<'LANGUAGE_CODE'> ;
    if(!language || !AVAILABLE_LANGUAGES.includes(language)) {
      //Priority 3: accept-language header
      language = getAcceptLanguage(req.headers.get('accept-language')) as EnumType<'LANGUAGE_CODE'>;
      if(!language || !AVAILABLE_LANGUAGES.includes(language)) {
        //Priority 4: default language
        language = DEFAULT_LANGUAGE;
      }
    }
  }
  const response = NextResponse.next();
  response.cookies.set(LANGUAGE_COOKIE_NAME, language);
  response.headers.set(LANGUAGE_HEADER, language);
  return response;
};

export const config = {
    matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};

export default middleware;
