import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { config } from "../config";

const getAppUrl = () => process.env.APP_URL || config.app_url || '';
const getApiV1Url = () => process.env.API_V1_URL || config.api_v1_url || '';

export const fetchApi = () => new FetchApi(getApiV1Url());
export const fetchFrontApi = () => new FetchApi(`${getAppUrl()}/api`);