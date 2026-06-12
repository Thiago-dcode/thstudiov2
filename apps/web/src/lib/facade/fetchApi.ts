import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { serverEnv } from "@/env/server";

export const fetchApi = () => new FetchApi(serverEnv.API_V1_URL);
export const fetchFrontApi = () => new FetchApi(`${serverEnv.APP_URL}/api`);
