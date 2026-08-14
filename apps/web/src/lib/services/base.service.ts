import {
  APP_TOKEN_HEADER,
  IP_ADDRESS_HEADER,
  LANGUAGE_HEADER,
  USER_AGENT_HEADER,
} from "@repo/common-lib/constants/constants";
import type { ApiResponse } from "@repo/common-lib/types/response";
import type { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { headers } from "next/headers";
import { serverEnv } from "@/env/server";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { getLanguage } from "../server-actions/get-language.server.action";

export class BaseService {
  constructor(
    protected readonly fetchApi: FetchApi,
    protected readonly module: string,
  ) {
    this.fetchApi.headers = {};
    this.fetchApi.baseUrl = `${fetchApi.baseUrl}/${this.module}`;
    // Returns headers for this call instead of writing them onto `fetchApi`: the client is a
    // module singleton shared by every concurrent SSR request, and this callback awaits, so
    // mutating it here let one visitor's request go out with another's session token.
    this.fetchApi.setRequestCallback(async ({ isPublic }) => {
      const language = await getLanguage();
      const baseHeaders = {
        Accept: "application/json",
        "Content-Type": "application/json",
        [LANGUAGE_HEADER]: language,
        // Proves to the API that the forwarded user-agent/IP below come from our own
        // server and not from an arbitrary client (see RequestMiddleware).
        [APP_TOKEN_HEADER]: serverEnv.APP_TOKEN,
      };

      // A public endpoint ignores the caller's identity, so sending it buys nothing and costs
      // caching: Next keys its fetch data cache on the request headers, so a per-visitor
      // user-agent or IP would make every visitor a separate cache entry.
      if (isPublic) {
        return baseHeaders;
      }

      const [session, headersList] = await Promise.all([
        userSession(),
        headers(),
      ]);
      return {
        ...baseHeaders,
        Authorization: `Bearer ${session?.token ?? ""}`,
        [USER_AGENT_HEADER]: headersList.get("user-agent") ?? "",
        [IP_ADDRESS_HEADER]: headersList.get("x-forwarded-for") ?? "",
      };
    });

    this.fetchApi.setResponseCallback<ApiResponse<any>>(async (_, response) => {
      if (response.error) {
        console.error("FETCH API ERROR", response.error);
      }
    });
  }
}
