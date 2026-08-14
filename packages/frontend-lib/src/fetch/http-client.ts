
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type BodyParam = Record<string, any> | FormData | null | undefined;

/**
 * Cache options for fetch requests
 * - `cache`: Standard RequestCache option ('default', 'no-store', 'force-cache', etc.)
 * - `next`: Next.js extended options for revalidation and tags
 */
type CacheOptions = {
    cache?: RequestCache;
    next?: {
        revalidate?: number | false;
        tags?: string[];
    };
};

type RequestParams = {
    method: Method;
    resource?: string;
    headers?: HeadersInit;
    body?: BodyParam;
    signal?: AbortSignal;
    cacheOptions?: CacheOptions;
    /**
     * Marks the endpoint as requiring no caller identity. The request callback uses this to send a
     * stable, minimal header set (no session token, no per-visitor user-agent/IP).
     *
     * This matters for more than tidiness: Next.js derives its fetch data-cache key from the request
     * headers, so a single per-visitor header makes every request a distinct cache entry and drops
     * the hit rate to zero. Any request that sets `cacheOptions` on a public endpoint wants this too.
     */
    isPublic?: boolean;
}
type BodyParsed = string | FormData | undefined;

/**
 * One request's fully-resolved state.
 *
 * This exists because the client is long-lived and shared: services are module singletons, so a
 * single `HttpClient` serves every concurrent SSR request. Holding per-request values (headers,
 * body, cache options) as instance fields meant a request that suspended on `await` could resume
 * to find another request's values in place — sending one visitor's call with another visitor's
 * session token and language. Everything a single call needs travels in here instead.
 */
type ResolvedRequest = {
    method: Method;
    resource: string;
    baseUrl: string;
    headers: HeadersInit;
    body: BodyParsed;
    signal?: AbortSignal;
    cacheOptions?: CacheOptions;
    credentials?: RequestCredentials;
    isPublic: boolean;
}

type FullRequestParams = Omit<RequestParams, 'body' | 'cacheOptions'> & {
    body: BodyParsed;
    baseUrl: string;
    signal?: AbortSignal;
    cacheOptions?: CacheOptions;
}
/**
 * Runs before each request. Return headers to merge over the client's defaults for this call only —
 * do not mutate the client, which is shared across concurrent requests.
 */
type RequestCallback = (RequestParams: FullRequestParams) => Promise<HeadersInit | void>;
type ResponseCallback<T> = (RequestParams: FullRequestParams, response: T) => Promise<any>;
type RequestParamsWithoutMethod = Omit<RequestParams, 'method'>;

export type { CacheOptions, RequestParamsWithoutMethod, ResolvedRequest };

export abstract class HttpClient {

    protected _requestCallback: RequestCallback = () => Promise.resolve({});
    protected _responseCallback: ResponseCallback<any> = () => Promise.resolve({});
    /** Baseline headers applied to every request. Never written per request — see `ResolvedRequest`. */
    protected _headers: HeadersInit = {};
    protected _baseUrl: string = '';
    protected _defaultCacheOptions?: CacheOptions;
    protected _credentials?: RequestCredentials;
    constructor(baseUrl: string, globalHeaders: HeadersInit = {}, defaultCacheOptions?: CacheOptions, credentials?: RequestCredentials) {
        this._headers = globalHeaders;
        this._baseUrl = baseUrl;
        this._defaultCacheOptions = defaultCacheOptions;
        this._credentials = credentials;
    }
    public set headers(headers: HeadersInit) {
        this._headers = {
            ...this._headers,
            ...headers,
        };
    }
    public set baseUrl(baseUrl: string) {
        this._baseUrl = baseUrl;
    }
    public get baseUrl(): string {
        return this._baseUrl;
    }
    public set defaultCacheOptions(cacheOptions: CacheOptions | undefined) {
        this._defaultCacheOptions = cacheOptions;
    }
    public get defaultCacheOptions(): CacheOptions | undefined {
        return this._defaultCacheOptions;
    }
    public set credentials(credentials: RequestCredentials | undefined) {
        this._credentials = credentials;
    }
    public get credentials(): RequestCredentials | undefined {
        return this._credentials;
    }
    protected parseBody(body: BodyParam): BodyParsed {
        if (body === null || body === undefined) {
            return undefined;
        }
        if (body instanceof FormData) {
            return body;
        }
        if (this.containsFile(body)) {
            // Convert to FormData if body contains File objects
            return this.objectToFormData(body);
        }
        return JSON.stringify(body);
    }

    private containsFile(obj: unknown): boolean {
        if (!obj) return false;
        if (obj instanceof File) return true;
        if (Array.isArray(obj)) return obj.some((v) => this.containsFile(v));
        if (typeof obj === 'object') {
            return Object.values(obj as Record<string, unknown>).some((v) => this.containsFile(v));
        }
        return false;
    }

    private objectToFormData(obj: Record<string, any>): FormData {
        const formData = new FormData();

        const append = (value: unknown, key: string) => {
            if (value === undefined || value === null) return;

            if (value instanceof File) {
                formData.append(key, value);
                return;
            }

            if (value instanceof Date) {
                formData.append(key, value.toISOString());
                return;
            }

            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    append(item, `${key}[${index}]`);
                });
                return;
            }

            if (typeof value === 'object') {
                Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
                    append(v, `${key}[${k}]`);
                });
                return;
            }

            formData.append(key, String(value));
        };

        for (const [key, value] of Object.entries(obj)) {
            append(value, key);
        }
        return formData;
    }
    protected abstract fetcher(request: ResolvedRequest): Promise<any>;

    /** Resolves one call's params against the client defaults. Pure: touches no instance state. */
    protected buildRequest({ resource = '', headers, body, method, signal, cacheOptions, isPublic }: RequestParams): ResolvedRequest {
        return {
            method,
            resource: resource.trim(),
            baseUrl: this._baseUrl,
            headers: { ...this._headers, ...headers },
            body: this.parseBody(body),
            signal,
            cacheOptions: cacheOptions ?? this._defaultCacheOptions,
            credentials: this._credentials,
            isPublic: isPublic ?? false,
        };
    }
    protected async callFetcher<T>(requestParams: RequestParams): Promise<T> {
        return await this.fetcher(this.buildRequest(requestParams));
    }
    public async setRequestCallback(callback: RequestCallback) {
        this._requestCallback = callback;
    }
    public async setResponseCallback<T>(callback: ResponseCallback<T>) {
        this._responseCallback = callback;
    }
    public async get<T>(requestParams: RequestParamsWithoutMethod = {}): Promise<T> {
        return await this.callFetcher({ ...requestParams, method: 'GET' });
    }
    public async post<T>(requestParams: RequestParamsWithoutMethod): Promise<T> {
        return await this.callFetcher({ ...requestParams, method: 'POST' });
    }
    public async patch<T>(requestParams: RequestParamsWithoutMethod): Promise<T> {
        return await this.callFetcher({ ...requestParams, method: 'PATCH' });
    }
    public async delete<T>(requestParams: RequestParamsWithoutMethod): Promise<T> {
        return await this.callFetcher({ ...requestParams, method: 'DELETE' });
    }
    public async put<T>(requestParams: RequestParamsWithoutMethod): Promise<T> {
        return await this.callFetcher({ ...requestParams, method: 'PUT' });
    }

}
