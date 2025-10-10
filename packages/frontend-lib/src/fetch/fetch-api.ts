import { ApiResponse } from "@repo/common-lib/types/response";
import { HttpClient } from "./http-client";

class FetchApi extends HttpClient{
    constructor(baseUrl: string, globalHeaders: HeadersInit = {}) {
        super(baseUrl, globalHeaders);
    }
    protected async fetcher<T>(): Promise<ApiResponse<T>> {
        const url = `${this._baseUrl}/${this._resource}`;
        try {
            await this._requestCallback({
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
            await this._responseCallback({
                resource: this._resource,
                headers: this._headers,
                body: this._body,
                method: this._method,
                baseUrl: this._baseUrl,
            }, data);
            if (!response.ok) {
                //TODO: Handle error
            }
            return data;
        } catch (error) {
            //TODO: Handle error
            throw error;
        }
    }
}

export { FetchApi };