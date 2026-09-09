import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { clientEnv } from "@/env/client";

/**
 * Browser twin of `lib/facade/fetchApi.ts`, which cannot be reused here: it reads `serverEnv`,
 * and that module is `server-only`, so importing it from a client component is a build error.
 *
 * `NEXT_PUBLIC_API_URL` already carries the `/api/v1` suffix (same shape as the server's
 * `API_V1_URL`), so `ClientBaseService`'s `${baseUrl}/${module}` concatenation works unchanged.
 *
 * A factory, not a singleton: `ClientBaseService` appends its module to the client's `baseUrl`,
 * so a shared instance would be suffixed once per service (`.../media/ai`).
 */
export const clientFetchApi = () => new FetchApi(clientEnv.NEXT_PUBLIC_API_URL);
