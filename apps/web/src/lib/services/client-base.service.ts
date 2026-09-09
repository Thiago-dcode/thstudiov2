import { LANGUAGE_HEADER } from "@repo/common-lib/constants/language";
import type { ApiResponse } from "@repo/common-lib/types/response";
import type { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { getClientLanguage } from "@/lib/i18n/client-language";
import {
  getClientAuthToken,
  refreshClientAuthToken,
} from "./client-session-token";

/**
 * Browser twin of `BaseService`, for calls that go straight from the page to the API instead of
 * through a Next route handler. Same contract: construct with a fresh `FetchApi` and a module
 * name, and the module is appended to the base URL.
 *
 * `BaseService` stays as-is and keeps serving SSR — these are twins, not replacements.
 */
export class ClientBaseService {
  constructor(
    protected readonly fetchApi: FetchApi,
    protected readonly module: string,
  ) {
    this.fetchApi.baseUrl = `${fetchApi.baseUrl}/${this.module}`;
    // The API's `enableCors` sets no `credentials: true`, so it never answers with
    // `Access-Control-Allow-Credentials` and the browser rejects a credentialed request at
    // preflight. `FetchApi` defaults to `'include'`, so this is load-bearing rather than
    // tidiness — and auth here is bearer-only, so there is nothing for cookies to carry.
    this.fetchApi.credentials = "omit";

    // Returns headers for this call rather than writing them onto `fetchApi`, matching
    // `BaseService`: the client is shared and this callback awaits.
    this.fetchApi.setRequestCallback(async ({ isPublic }) => {
      const baseHeaders = {
        Accept: "application/json",
        // Stripped by `FetchApi` when the body is FormData, so the browser can set the
        // multipart boundary itself.
        "Content-Type": "application/json",
        [LANGUAGE_HEADER]: getClientLanguage(),
      };

      // Three headers `BaseService` sends are deliberately absent. `x-app-token` is a server
      // secret and cannot ship to the browser; `x-app-user-agent` and `x-app-ip-address` exist
      // only so our own server can forward the end user's identity when it proxies, and the API
      // honours them *only* when the app token proves a trusted caller. Without all three the
      // API falls back to the real `user-agent` and `req.ip` — which, for a request that
      // genuinely originates in the browser, is the correct answer rather than a fallback.
      if (isPublic) {
        return baseHeaders;
      }

      const token = await getClientAuthToken();
      return {
        ...baseHeaders,
        Authorization: `Bearer ${token ?? ""}`,
      };
    });

    this.fetchApi.setResponseCallback<ApiResponse<any>>(async (_, response) => {
      if (response.error) {
        console.error("CLIENT FETCH API ERROR", response.error);
      }
    });
  }

  /**
   * Runs a call, retrying once if it 401s because the session token went stale.
   *
   * `proxy.ts` rotates the token ~10 minutes before expiry, so a tab left open long enough
   * holds a token the API no longer accepts even though the user is still signed in. Without
   * this, that surfaces as a spurious "Unauthorized" on the next upload.
   *
   * The retry lives here rather than in `FetchApi` because neither of its hooks can re-issue a
   * request: `setRequestCallback` runs before a response exists, and `setResponseCallback`'s
   * return value is discarded. Putting a loop in `HttpClient` instead would silently double
   * every SSR request too.
   *
   * `call` is a thunk so that re-invoking it re-enters `buildRequest`/`parseBody` and builds a
   * fresh `FormData` from the plain body, rather than replaying a consumed one.
   */
  protected async send<T>(
    call: () => Promise<ApiResponse<T>>,
  ): Promise<ApiResponse<T>> {
    // Read before the call so we know which token the request callback is about to use. This is
    // free: it awaits the same memoized promise the callback awaits, so there is still only one
    // `userSession()` round trip.
    const tokenUsed = await getClientAuthToken();

    const response = await call();
    if (response.error?.status_code !== 401) return response;

    const refreshed = await refreshClientAuthToken(tokenUsed);

    // Nothing rotated (or there is no session at all), so the 401 is genuine. Retrying would
    // only burn a second request — and for a media create, a second upload of the whole file.
    // This is also what bounds the retry at one: a token that keeps failing can never loop.
    if (!refreshed || refreshed === tokenUsed) return response;

    return await call();
  }
}
