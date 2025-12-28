import { ApiResponse } from "@repo/common-lib/types/response";
import { HttpClient } from "./http-client";

class FetchApi extends HttpClient{
    constructor(baseUrl: string, globalHeaders: HeadersInit = {}) {
        super(baseUrl, globalHeaders);
    }
    protected async fetcher<T>(): Promise<ApiResponse<T>> {
        let url = `${this._baseUrl}`;
        if(this._resource){
            const firstChar = this._resource.charAt(0);
            const prepend = firstChar === '?' || firstChar === '/'?'':'/';
            url+= `${prepend}${this._resource}`;
        }
        try {
            await this._requestCallback({
                resource: this._resource,
                headers: this._headers,
                body: this._body,
                method: this._method,
                baseUrl: this._baseUrl,
                signal: this._signal,
            });
         
            // If body is FormData, remove Content-Type header to let browser set it with boundary
            const headers = this._body instanceof FormData 
                ? Object.fromEntries(
                    Object.entries(this._headers).filter(([key]) => key.toLowerCase() !== 'content-type')
                  )
                : this._headers;
            const response = await fetch(url.trim(), {
                method: this._method,
                headers: headers,
                body: this._body,
                signal: this._signal,
                credentials: 'include',
                ...this.defaultCacheOptions,
                ...this.cacheOptions
                
            });
            const data = await response.json();
            await this._responseCallback({
                resource: this._resource,
                headers: this._headers,
                body: this._body,
                method: this._method,
                baseUrl: this._baseUrl,
                signal: this._signal,
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