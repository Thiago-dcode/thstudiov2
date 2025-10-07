import { ApiResponse } from "@repo/common-lib/types/response";
import { HttpClient } from "./http-client";
import { getConfigValue } from "@repo/common-lib/config/utils";


class FetchApi extends HttpClient{
    constructor(globalHeaders: HeadersInit = {}) {
        super(getConfigValue('api').v1Url, globalHeaders);
    }
    protected async fetcher<T>(): Promise<ApiResponse<T>> {
        const url = `${this._baseUrl}/${this._resource}`;
        try {
            await this._beforeRequestCallback({
                resource: this._resource,
                headers: this._headers,
                body: this._body,
                method: this._method,
                baseUrl: this._baseUrl,
            });
         
            const response = await fetch(url, {
                method: this._method,
                headers: this._headers,
                body: this._body,   
            });
            const data = await response.json();
            await this._afterRequestCallback({
                resource: this._resource,
                headers: this._headers,
                body: this._body,
                method: this._method,
                baseUrl: this._baseUrl,
            }, data);
            if (!response.ok) {
                //TODO: Handle error
            }
            //TODO: Format response
            console.log(data);
            return data;
        } catch (error) {
            console.error("error", error);
            //TODO: Handle error
            throw error;
        }
    }
}

export { FetchApi };