import { ApiResponse, ErrorResponse } from "@repo/common-lib/types/response";
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

            // Handle non-OK responses
            if (!response.ok) {
                let errorData: ErrorResponse;
                try {
                    // Try to parse error response from server
                    const parsedData = await response.json();
                    // Check if response already has the ErrorResponse format
                    if (parsedData.error && parsedData.data === null) {
                        errorData = parsedData as ErrorResponse;
                    } else {
                        // Create ErrorResponse from HTTP status
                        errorData = this.createErrorResponse(
                            response.status,
                            parsedData?.message || response.statusText || 'Request failed',
                            Array.isArray(parsedData?.errors) ? parsedData.errors : [parsedData?.message || response.statusText || 'An error occurred'],
                            url
                        );
                    }
                } catch (parseError) {
                    // If JSON parsing fails, create a generic error response
                    errorData = this.createErrorResponse(
                        response.status,
                        response.statusText || 'Request failed',
                        [`HTTP ${response.status}: ${response.statusText || 'An error occurred'}`],
                        url
                    );
                }
                await this._responseCallback({
                    resource: this._resource,
                    headers: this._headers,
                    body: this._body,
                    method: this._method,
                    baseUrl: this._baseUrl,
                    signal: this._signal,
                }, errorData);
                return errorData;
            }

            // Parse successful response
            let data: ApiResponse<T>;
            try {
                data = await response.json();
            } catch (parseError) {
                // If JSON parsing fails on successful response, create error
                const errorData = this.createErrorResponse(
                    500,
                    'Invalid response format',
                    ['The server returned an invalid response format'],
                    url
                );
                await this._responseCallback({
                    resource: this._resource,
                    headers: this._headers,
                    body: this._body,
                    method: this._method,
                    baseUrl: this._baseUrl,
                    signal: this._signal,
                }, errorData);
                return errorData;
            }

            await this._responseCallback({
                resource: this._resource,
                headers: this._headers,
                body: this._body,
                method: this._method,
                baseUrl: this._baseUrl,
                signal: this._signal,
            }, data);
            return data;
        } catch (error) {
            // Handle AbortError - rethrow so it can be handled upstream
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }

            // Handle network errors and other fetch failures
            const errorData = this.createErrorResponse(
                0,
                error instanceof Error ? error.message : 'Network error',
                [error instanceof Error ? error.message : 'Failed to fetch. Please check your connection and try again.'],
                url
            );
            
            try {
                await this._responseCallback({
                    resource: this._resource,
                    headers: this._headers,
                    body: this._body,
                    method: this._method,
                    baseUrl: this._baseUrl,
                    signal: this._signal,
                }, errorData);
            } catch (callbackError) {
                // Ignore callback errors to prevent masking the original error
            }
            
            return errorData;
        }
    }

    private createErrorResponse(
        statusCode: number,
        message: string,
        errors: string[],
        path: string
    ): ErrorResponse {
        return {
            audit: {
                ip: '',
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                request_time: Date.now(),
            },
            error: {
                status_code: statusCode,
                message,
                errors,
                path,
            },
            data: null,
        };
    }
}

export { FetchApi };