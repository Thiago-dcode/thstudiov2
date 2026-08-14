import { ApiResponse, ErrorResponse, SuccessResponse } from "@repo/common-lib/types/response";
import { HttpClient, ResolvedRequest } from "./http-client";

class FetchApi extends HttpClient {
    constructor(baseUrl: string, globalHeaders: HeadersInit = {}) {
        super(baseUrl, globalHeaders);
    }
    /**
     * Reads only from `request`, never from `this._*`: the client is shared across concurrent
     * requests, and the request callback below awaits (cookies, headers, locale), so any instance
     * field read after that await could belong to a different request by the time we resume.
     */
    protected async fetcher<T>(request: ResolvedRequest): Promise<ApiResponse<T>> {
        let url = `${request.baseUrl}`;
        if (request.resource) {
            const firstChar = request.resource.charAt(0);
            const prepend = firstChar === '?' || firstChar === '/' ? '' : '/';
            url += `${prepend}${request.resource}`;
        }
        const callbackParams = {
            resource: request.resource,
            headers: request.headers,
            body: request.body,
            method: request.method,
            baseUrl: request.baseUrl,
            signal: request.signal,
            isPublic: request.isPublic,
        };
        try {
            const callbackHeaders = await this._requestCallback(callbackParams);
            const resolvedHeaders = { ...request.headers, ...(callbackHeaders ?? {}) };
            callbackParams.headers = resolvedHeaders;

            // If body is FormData, remove Content-Type header to let browser set it with boundary
            const headers = request.body instanceof FormData
                ? Object.fromEntries(
                    Object.entries(resolvedHeaders).filter(([key]) => key.toLowerCase() !== 'content-type')
                )
                : resolvedHeaders;
            const response = await fetch(url.trim(), {
                method: request.method,
                headers: headers,
                body: request.body,
                signal: request.signal,
                credentials: request.credentials ?? 'include',
                ...request.cacheOptions

            });

            // Handle non-OK responses
            if (!response.ok) {
                let errorData: ErrorResponse;
                try {
                    // Try to parse error response from server
                    const parsedData = await response.json();
                    // Check if response already has the ApiResponse structure
                    if (this.isApiResponse(parsedData)) {
                        // If it's already an ErrorResponse, use it
                        if (this.isErrorResponse(parsedData)) {
                            errorData = parsedData as ErrorResponse;
                        } else {
                            // If it's a SuccessResponse but response is not OK, convert to ErrorResponse
                            errorData = this.parseErrorResponse(
                                response.status,
                                response.statusText || 'Request failed',
                                ['Unexpected success response format for error status'],
                                url
                            );
                        }
                    } else {
                        // Create ErrorResponse from HTTP status
                        errorData = this.parseErrorResponse(
                            response.status,
                            parsedData?.message || response.statusText || 'Request failed',
                            Array.isArray(parsedData?.errors) ? parsedData.errors : [parsedData?.message || response.statusText || 'An error occurred'],
                            url
                        );
                    }
                } catch (parseError) {
                    // If JSON parsing fails, create a generic error response
                    errorData = this.parseErrorResponse(
                        response.status,
                        response.statusText || 'Request failed',
                        [`HTTP ${response.status}: ${response.statusText || 'An error occurred'}`],
                        url
                    );
                }
                await this._responseCallback(callbackParams, errorData);
                return errorData;
            }

            // Parse successful response
            let data: ApiResponse<T>;
            try {
                const parsedData = await response.json();
                // Check if response already has the ApiResponse structure
                if (this.isApiResponse(parsedData)) {
                    data = parsedData as SuccessResponse<T>;
                } else {
                    // Wrap the response in SuccessResponse structure
                    data = this.parseSuccessResponse(parsedData);
                }
            } catch (parseError) {
                // If JSON parsing fails on successful response, create error
                const errorData = this.parseErrorResponse(
                    500,
                    'Invalid response format',
                    ['The server returned an invalid response format'],
                    url
                );
                await this._responseCallback(callbackParams, errorData);
                return errorData;
            }

            await this._responseCallback(callbackParams, data);
            return data;
        } catch (error) {
            // Handle AbortError - rethrow so it can be handled upstream
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }

            // Handle network errors and other fetch failures
            const errorData = this.parseErrorResponse(
                0,
                error instanceof Error ? error.message : 'Network error',
                [error instanceof Error ? error.message : 'Failed to fetch. Please check your connection and try again.'],
                url
            );

            try {
                await this._responseCallback(callbackParams, errorData);
            } catch (callbackError) {
                // Ignore callback errors to prevent masking the original error
            }

            return errorData;
        }
    }

    private isApiResponse(data: any): data is ApiResponse<any> {
        return (
            data &&
            typeof data === 'object' &&
            'audit' in data &&
            typeof data.audit === 'object' &&
            ('error' in data || 'data' in data)
        );
    }

    private isErrorResponse(data: any): data is ErrorResponse {
        return (
            this.isApiResponse(data) &&
            'error' in data &&
            data.error !== null &&
            data.data === null
        );
    }

    private parseSuccessResponse<T>(data: T): SuccessResponse<T> {
        return {
            audit: {
                ip: '',
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                request_time: Date.now(),
            },
            data: data,
            error: null,
        };
    }

    private parseErrorResponse(
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
