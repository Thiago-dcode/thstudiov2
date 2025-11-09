import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { config } from "../config";

export const fetchApi = ()=>  new FetchApi(config.api_v1_url);