import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { getLanguage } from "../server-actions/get-language.server.action";
import { LANGUAGE_HEADER } from "@repo/common-lib/constants";
import { userSession } from "@/modules/auth/server-actions/get-session.action";

export class BaseService {
    constructor(protected readonly fetchApi: FetchApi, protected readonly module:string) {
        this.fetchApi.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
        };
        this.fetchApi.baseUrl = fetchApi.baseUrl + '/' + this.module;
        this.fetchApi.setBeforeRequestCallback(async () => {

            //TODO : get bearer token from session
            const token = (await userSession())?.token ?? '';
            const language = await getLanguage();
            fetchApi.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                [LANGUAGE_HEADER]: language,
                'Authorization': `Bearer ${token}`,
            };
    
        });
    }
}   