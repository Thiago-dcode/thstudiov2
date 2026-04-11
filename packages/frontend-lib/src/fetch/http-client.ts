
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
}
type BodyParsed = string | FormData | undefined;
type FullRequestParams = Omit<RequestParams, 'body' | 'cacheOptions'> & {
    body: BodyParsed;
    baseUrl: string;
    signal?: AbortSignal;
    cacheOptions?: CacheOptions;
}
type RequestCallback = (RequestParams: FullRequestParams) => Promise<any>;
type ResponseCallback<T> = (RequestParams: FullRequestParams, response: T) => Promise<any>;
type RequestParamsWithoutMethod = Omit<RequestParams, 'method'>;

export type { CacheOptions, RequestParamsWithoutMethod };

export abstract class HttpClient {

    protected _requestCallback: RequestCallback = () => Promise.resolve({});
    protected _responseCallback: ResponseCallback<any> = () => Promise.resolve({});
    protected _headers: HeadersInit = {};
    protected _body: BodyParsed = undefined;
    protected _method: Method = 'GET';
    protected _resource: string = '';
    protected _baseUrl: string = '';
    protected _signal?: AbortSignal;
    protected _cacheOptions?: CacheOptions;
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
    protected set method(method: Method) {
        this._method = method;
    }
    public get method(): Method {
        return this._method;
    }
    protected set resource(resource: string) {
        this._resource = resource;
    }
    public get resource(): string {
        return this._resource;
    }
    public set signal(signal: AbortSignal | undefined) {
        this._signal = signal;
    }
    public get signal(): AbortSignal | undefined {
        return this._signal;
    }
    public set cacheOptions(cacheOptions: CacheOptions | undefined) {
        this._cacheOptions = cacheOptions;
    }
    public get cacheOptions(): CacheOptions | undefined {
        return this._cacheOptions ?? this._defaultCacheOptions;
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
    protected set body(body: BodyParam) {
        if (body === null || body === undefined) {
            this._body = undefined;
        }
        else if (body instanceof FormData) {
            this._body = body;
        }
        else if (this.containsFile(body)) {
            // Convert to FormData if body contains File objects
            this._body = this.objectToFormData(body);
        }
        else {
            this._body = JSON.stringify(body);
        }
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
    protected abstract fetcher(): Promise<any>;

    protected async setupRequest({ resource = '', headers, body, method, signal, cacheOptions }: RequestParams): Promise<void> {
        this.headers = headers || {};
        this.method = method;
        this.resource = resource.trim();
        this.body = body;
        this.signal = signal;
        this.cacheOptions = cacheOptions;
    }
    protected async callFetcher<T>(requestParams: RequestParams): Promise<T> {
        this.setupRequest(requestParams);
        return await this.fetcher();
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