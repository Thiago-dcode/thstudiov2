import { FetchApi } from "@repo/frontend-lib/fetch/fetch-api";
import { getLanguage } from "../server-actions/get-language.server.action";
import { IP_ADDRESS_HEADER, LANGUAGE_HEADER, USER_AGENT_HEADER } from "@repo/common-lib/constants";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { headers } from "next/headers";
import { ApiResponse } from "@repo/common-lib/types/response";

export class BaseService {
    constructor(protected readonly fetchApi: FetchApi, protected readonly module: string) {
        this.fetchApi.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        this.fetchApi.baseUrl = fetchApi.baseUrl + '/' + this.module;
        this.fetchApi.setRequestCallback(async () => {
            console.log('request callback');
            const [session, language, headersList] = await Promise.all([
                userSession(),
                getLanguage(),
                headers(),
            ]);
            fetchApi.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                [LANGUAGE_HEADER]: language,
                'Authorization': `Bearer ${session?.token ?? ''}`,
                [USER_AGENT_HEADER]: headersList.get('user-agent') ?? '',
                [IP_ADDRESS_HEADER]: headersList.get('x-forwarded-for') ?? '',
            };

        });

        this.fetchApi.setResponseCallback<ApiResponse<any>>(async (_, response) => {
        });
    }
}   