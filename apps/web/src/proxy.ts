import { NextRequest, NextResponse  } from "next/server";
import { ENUMS } from "@repo/common-lib/constants/enums";
import { EnumType } from "@repo/common-lib/constants/enums";
import { LANGUAGE_HEADER, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from "@repo/common-lib/constants/constants";
import { getAcceptLanguage } from "@repo/common-lib/utils/get-accept-language";
import { deleteUserSessionByCookie, getRememberMeByCookie, getUserSessionExpirationDateByCookie, setUserSessionByCookie, userSessionByCookie } from "./modules/auth/server-actions/user-session.action";
import { subMinutes,   } from "date-fns";
import authService from "./modules/auth/auth.service";
import { RequestCookies, ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";userSessionByCookie

const AVAILABLE_LANGUAGES = ENUMS.LANGUAGE_CODE;
//Only refresh token if the user is authenticated
const handleRefreshToken = async (cookies: RequestCookies,responseCookies: ResponseCookies)=>{
 const expirationDate = await getUserSessionExpirationDateByCookie(cookies);
 const tenMinutes = 10 * 60 * 1000;
 const now = new Date().getTime();
 const expirationDate10MinutesAgo = expirationDate ? subMinutes(expirationDate,10).getTime() : null;
 //Only refresh if the token is going to expire in less than 10 minutes
 if(!expirationDate10MinutesAgo || expirationDate10MinutesAgo - now > tenMinutes){
  return;
 }
 const userAuth = await userSessionByCookie(cookies);
  if(!userAuth)return;
  console.log("Refreshing token");
 const result = await authService.refreshToken();
 if(!result?.data || result.error){
  console.log("Token refresh failed");
   deleteUserSessionByCookie(responseCookies);
}else{
  console.log("Token refreshed successfully");
  await setUserSessionByCookie(result.data,responseCookies);
}

}
const handleRememberMe = async (cookies: RequestCookies,responseCookies: ResponseCookies)=>{
  const rememberMe = await getRememberMeByCookie(cookies);
  if(!rememberMe) return;
const userAuth = await (cookies);
 if(userAuth)return;

}

const middleware = async (req: NextRequest) => {
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
  const responseCookies = response.cookies;
  responseCookies.set(LANGUAGE_COOKIE_NAME, language);
  response.headers.set(LANGUAGE_HEADER, language);
  await handleRefreshToken(requestCookies,responseCookies);
  await handleRememberMe(requestCookies,responseCookies);
  

  return response;
};

export const config = {
    matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};

export default middleware;
