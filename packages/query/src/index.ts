/**
 * # @emdgroup/react-query
 *
 * React hooks for the fetch API with support for client-side caching
 *
 * Usage:
 *
 * ```tsx
 * import { useCachedQuery, isHTTPError } from '@emdgroup/react-query';
 *
 * const { status, response, revalidate, error } = useCachedQuery<{ email: string }>('http://example.com/userinfo');
 *
 * function Profile() {
 *   if (status === 'loading') return 'Loading';
 *   if (isHTTPError(error, 404)) return 'Not found';
 *   if (error) return 'Unknown error';
 *   return `Hello ${response?.email}`;
 * }
 *
 * ## Lazy Queries
 *
 * To enable a query at a later time (for example if the query depends on a previous query),
 * the method can be set to `null` which will effectively defer the query until the query
 * method is defined.
 *
 * function ToDos() {
 *   const [filter, setFilter] = useState(false);
 *   const { response } = useQuery('/todos', { method: filter ? 'GET' : null });
 *
 *   // ...
 * }
 * ```
 *
 * ## Hooks
 * 
 * * [useCachedQuery](#usecachedquery)
 * * [useQuery](#usequery)
 * * [useOnlineStatus](#useonlinestatus)
 *
 * ## Functions
 *
 * * [isHTTPError](#ishttperror)
 *
 * @module
 */

import { useState, useEffect, useCallback } from 'react';
import qs from './qs.js';
import { useLocalStorage } from '@emdgroup/react-storage';



/**
 * Status of the request. Starts out with `idle`, then transitions from `loading`
 * to either `success` or `error`.
 */

export type QueryStatus = 'success' | 'loading' | 'error' | 'idle';

export type Body = BodyInit | null | Record<string, unknown>;

/**
 * Implementation of the [NodeJS `querystring`](https://nodejs.org/docs/latest-v12.x/api/querystring.html) module for the browser.
 */

export const querystring = qs;

/**
 * Sleep function that supports an optional [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal). If the signal is aborted
 * the returned Promise will immediately reject with a `DOMException` and name `AbortError`.
 */

export async function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(signal?.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearInterval(timer);
            reject(signal?.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}


/**
 * ## RequestOptions
 *
 * The request options extends the options from the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) with `retry`, `retryMs` and `queryParameters`.
 */

export interface RequestOptions {
    /** A BodyInit object or null to set request's body.  If the body is a plain object it will be serialized as JSON. */
    body?: Body;
    /** A string indicating how the request will interact with the browser's cache to set request's cache. */
    cache?: RequestCache;
    /** A string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. Sets request's credentials. */
    credentials?: RequestCredentials;
    /** A Headers object, an object literal, or an array of two-item arrays to set request's headers. */
    headers?: HeadersInit;
    /** A cryptographic hash of the resource to be fetched by request. Sets request's integrity. */
    integrity?: string;
    /** A boolean to set request's keepalive. */
    keepalive?: boolean;
    /** A string to set request's method. */
    method?: string | null;
    /** A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request's mode. */
    mode?: RequestMode;
    /** A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request's redirect. */
    redirect?: RequestRedirect;
    /** A string whose value is a same-origin URL, "about:client", or the empty string, to set request's referrer. */
    referrer?: string;
    /** A referrer policy to set request's referrerPolicy. */
    referrerPolicy?: ReferrerPolicy;
    /** An AbortSignal to set request's signal. */
    signal?: AbortSignal | null;
    /** Can only be null. Used to disassociate request from any Window. */
    window?: null;
    /** Optional query parameters that will be encoded and appended to the URL. */
    queryParameters?: URLSearchParams | Record<string, string>;
    /** Number of times a request with a 429 status code us retried. Defaults to 3. */
    retry?: number;
    /** Milliseconds to wait before the next request is retried. Subsequent requests will be multiplied by `Math.LOG2E`. A random jitter of 50% of the `retryMs` value is applied. */
    retryMs?: number;
}

function parseRequestArguments(args: unknown[]): [path: string, options: RequestOptions] {
    let path: string;
    let requestOptions: RequestOptions = {};
    if (args.length === 1 || args.length === 2 && (args[1] as Record<string, unknown>).constructor === Object) {
        requestOptions = args[1] as RequestOptions || {};
        path = args[0] as string;
    } else {
        const [method, , body, headers] = args as [string | null, string, Body, Record<string, string>];
        path = args[1] as string;
        requestOptions = { method, body, headers };
    }
    return [path, requestOptions];
}

export async function request<T>(
    input: string,
    args: RequestOptions = { },
): Promise<{ response: Response; body?: T; error?: Error }> {
    const { retry = 3, retryMs = 250, signal, queryParameters = {} } = args;
    const qs = new URLSearchParams(queryParameters);
    const body = args.body?.constructor === Object ? JSON.stringify(args.body) : args.body;
    const res = await fetch(`${qs}` ? `${input}?${qs}` : input, {
        headers: {
            'content-type': 'application/json',
            ...args.headers,
        },
        credentials: 'omit',
        mode: 'cors',
        method: args.method ?? 'GET',
        body: body as BodyInit,
        signal,
    });

    if (retry && res.status === 429) return sleep(
        retryMs * 1.25 - Math.random() * retryMs / 2,
        signal,
    ).then(() => request(input, { ...args, retryMs: retryMs * Math.LOG2E, retry: retry - 1 }));

    const text = await res.text();
    try {
        const body = text.length ? JSON.parse(text) : text;
        return { response: res, body: body };
    } catch (err: unknown) {
        return { response: res, error: err instanceof Error ? err : new Error('unknown error') };
    }
}

const encoder = new TextEncoder();
function toBase64(buf: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * ## QueryResponse
 *
 * Response object returned from `useQuery` and `useCachedQuery`.
 */

export interface QueryResponse<T> {
    /** Status of the request. */
    status?: QueryStatus;
    /** Error object, available when status is `error`. */
    error?: Error;
    /** Response object from the server. */
    response?: T;
    /** Function to call to request a refresh of the query. */
    revalidate: () => void;
}

/** `useCachedQuery` accepts the same parameters as [`useQuery`](#usequery). It will
 * immediately return the cached result if it exists for `GET` requests and set the
 * `status` to `success`. The request will still be performed and the response is
 * updated once the request is complete. Any failed request will clear the cache.
 *
 * The response is cached in the browser's localStorage (if available).
 */

export function useCachedQuery<T>(path: string, request: RequestOptions): QueryResponse<T>;

export function useCachedQuery<T>(
     /** HTTP request method. Set to `null` to defer the request. */
     method: string | null,
     /** The path to the API endpoint. Can be a full URL or just a path to a resource on the origin. */
     path: string,
     /** If `body` is a string, it will be sent as the request body. If it is an object, it will be serialized as JSON. */
     body?: Body,
     /** If provided, the header will be passed to the request. Make sure that the headers object is memoized and not created per render. */
     headers?: { [key: string]: string },
 ): QueryResponse<T>;
export function useCachedQuery<T>(...args: unknown[]): QueryResponse<T> {
    const [path, { method, body, headers, ...requestOptions }] = parseRequestArguments(args);
    const [cacheKey, setCacheKey] = useState<string>();
    useEffect(() => {
        if (method !== 'GET') return;
        crypto.subtle.digest('SHA-256', encoder.encode([path].join('\0'))).then((digest) => setCacheKey(toBase64(digest)));
    }, [method, path]);
    const [cached, setCached, clearCache] = useLocalStorage<T>(cacheKey && `cached.${cacheKey}`);
    const res = useQuery<T>(path, {
        method: (cacheKey || method !== 'GET') ? method : null, body, headers, ...requestOptions });
    useEffect(() => {
        if (res.status === 'success' && res.response) setCached(res.response);
        else if (res.status === 'error') clearCache();
    }, [res.status, res.response, setCached, clearCache]);
    return cached && res.status !== 'success' && res.status !== 'error' ? {
        ...res,
        response: cached,
    } : res;
}

/**
 * `useOnlineStatus` will return a boolean that indicates if the user is currently online. This useful
 * if you want to prevent the browser to make requests or redirects that will fail. Note that this
 * is not a reliable way to determine if the user is online. See
 * [`navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) for more details.
 *
 * This hook will listen to changes to the online status and will update accordingly.
 *
 * ```ts
 * const online = useOnlineStatus();
 * ```
 */

export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState(typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true);
    const onlineCb = useCallback(() => setOnline(navigator.onLine), []);
    useEffect(() => {
        if ('onLine' in navigator) {
            window.addEventListener('online', onlineCb);
            window.addEventListener('offline', onlineCb);
            return () => {
                window.removeEventListener('online', onlineCb);
                window.removeEventListener('offline', onlineCb);
            };
        }
    }, [onlineCb]);
    return online;
}

export function useWindowFocus(cb: () => void): void {
    const [focused, setFocused] = useState<boolean>();
    const onChange = useCallback((event: Event) => {
        if (typeof document !== undefined && event.type === 'visibilitychange')
            setFocused(document.visibilityState === 'visible');
        else setFocused(event.type === 'focus');
    }, [setFocused]);
    useEffect(() => {
        if (typeof window?.addEventListener === undefined) return;
        ['visibilitychange', 'focus', 'blur'].forEach((ev) => window.addEventListener(ev, onChange));
        return () => ['visibilitychange', 'focus', 'blur'].forEach((ev) => window.removeEventListener(ev, onChange));
    }, [onChange]);
    const online = useOnlineStatus();
    useEffect(() => { online && focused && cb(); }, [online, focused, cb]);
}

/**
 * # HTTPError
 *
 * If the server responds with an HTTP error (status code > 399) then a `HTTPError` exception is thrown.
 */

export class HTTPError extends Error {
    /** HTTP status code of the error response. */
    status;
    /** The response body if available. */
    response;

    constructor(res: Response, body: any) {
        super(res.statusText);
        this.name = 'HTTPError';
        this.status = res.status;
        this.response = body;
    }
}

/**
 * Type guard for the error response returned by the `useQuery` and `useCachedQuery` hooks.
 * The function returns true if the server returns an HTTP error with an error code. A Network error
 * is not an HTTP error and will not return true when passed to this function.
 */

export function isHTTPError(error: unknown, status?: number): error is HTTPError {
    return error instanceof HTTPError && (status === undefined || status === (error as HTTPError).status);
}


/** `useQuery<T>` is a generic hook for making `fetch` requests. The type `T` is the type of the response body.
 *
 * ```tsx
 * const { status, response, revalidate, error } = useQuery<{ email: string }>('http://example.com/userinfo');
 *
 * useEffect(() => {
 *    if (status === 'success') {
 *      // do something with response
 *    } if (status === 'error') {
 *     // do something with error
 *    }
 * }, [status, response, error]);
 *
 * return status === 'success' ? (<p>Email: {response.email}</p>) : (<p>Loading</p>);
 * ```
 *
 * For authenticated requests that require a custom header, consider creating a custom hook that passes the
 * header using a `useMemo` hook:
 *
 * ```ts
 * function useApi<T>(...[method, path, body]: Parameters<typeof useQuery>) {
 *   const { token } = useUser();
 *   const header = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
 *   return useQuery<T>(method, path, body, header);
 * }
 * ```
 */

export function useQuery<T>(path: string, request: RequestOptions): QueryResponse<T>;

export function useQuery<T>(
    /** HTTP request method. Set to `null` to defer the request. */
    method: string | null,
    /** The path to the API endpoint. Can be a full URL or just a path to a resource on the origin. */
    path: string,
    /** If `body` is a string, it will be sent as the request body. If it is an object, it will be serialized as JSON. */
    body?: Body,
    /** If provided, the header will be passed to the request. Make sure that the headers object is memoized and not created per render. */
    headers?: { [key: string]: string },
): QueryResponse<T>;

export function useQuery<T>(...args: unknown[]): QueryResponse<T> {
    const [path, { method, body, headers, ...requestOptions }] = parseRequestArguments(args);
    const [response, setResponse] = useState<T>();
    const [status, setStatus] = useState<QueryStatus>('idle');
    const [error, setError] = useState<Error>();

    const fetchData = useCallback(() => {
        setStatus('idle');
        if (method === null) {
            setResponse(undefined);
            setError(undefined);
            return;
        }
        setStatus('loading');
        let cancelled = false;
        const controller = typeof AbortController === 'function' && !requestOptions.signal ? new AbortController() : undefined;
        request<T>(path, { method, body, headers, signal: controller?.signal, ...requestOptions })
            .then(
                ({ response: res, body, error: err }) => {
                    if (cancelled) return;
                    if (res.ok) {
                        setResponse(body);
                        setStatus('success');
                    } else {
                        if (err) setError(err);
                        else setError(new HTTPError(res, body));
                        setStatus('error');
                    }
                },
                (err) => {
                    setError(err);
                    setStatus('error');
                }
            )
            .catch((err) => {
                setError(err);
                setStatus('error');
            });
        return () => {
            cancelled = true;
            controller?.abort();
        };
    // requestOptions is keyed by method, path and body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [method, path, body, headers]);

    useEffect(fetchData, [fetchData]);

    return { status, error, response, revalidate: fetchData };
}
