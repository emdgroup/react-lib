import { useState, useEffect, useCallback } from 'react';
import qs from './qs.js';
import { useLocalStorage } from '@emdgroup/react-storage';

/**
 * Status of the request. Starts out with `idle`, then transitions from `loading`
 * to either `success` or `error`.
 */

export type QueryStatus = 'success' | 'loading' | 'error' | 'idle';

export type Method = 'POST' | 'GET' | 'PUT' | 'DELETE';

export type Body = { [key: string]: unknown };

/**
 * Implementation of the [NodeJS `querystring`](https://nodejs.org/docs/latest-v12.x/api/querystring.html) module for the browser.
 */

export const querystring = qs;

export async function request<T>(
    input: string,
    args: {
      method?: Method;
      body?: Body | string;
      headers?: { [key: string]: string };
      queryParameters?: { [key: string]: string };
    } = {}
): Promise<{ response: Response; body?: T; error?: Error }> {
    const qs = querystring.stringify(args.queryParameters);
    const res = await fetch(qs ? `${input}?${qs}` : input, {
        headers: {
            'content-type': 'application/json',
            ...args.headers,
        },
        credentials: 'omit',
        mode: 'cors',
        method: args.method,
        body: args.method === 'GET' ? undefined : typeof args.body === 'object' ? JSON.stringify(args.body) : args.body,
    });

    const text = await res.text();
    try {
        const body = text.length ? JSON.parse(text) : text;
        return { response: res, body: body };
    } catch (err) {
        return { response: res, error: err };
    }
}

const encoder = new TextEncoder();
function toBase64(buf: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * Response object returned from `useQuery` and `useCachedQuery`.
 */

export interface QueryResponse<T> {
    /** Status of the request */
    status?: QueryStatus;
    /** error object */
    error?: Error;
    /** Response object from the server */
    response?: T;
    /** Function to call to request a refresh of the query */
    revalidate: () => void;
}

/** `useCachedQuery` accepts the same parameters as [`useQuery`](#usequery). It will
 * immediately return the cached result if it exists for `GET` requests and set the
 * `status` to `success`. The request will still be performed and the response is
 * updated once the request is complete. Any failed request will clear the cache.
 *
 * The response is cached in the browser's localStorage (if available).
 */

export function useCachedQuery<T>(
    /** HTTP request method. Set to `null` to defer the request. */
    method: Method | null,
    /** The path to the API endpoint. Can be a full URL or just a path to a resource on the origin. */
    path: string,
    /** If `body` is a string, it will be sent as the request body. If it is an object, it will be serialized as JSON. */
    body?: Body | string,
    /** If provided, the header will be passed to the request. Make sure that the headers object is memoized and not created per render. */
    headers?: { [key: string]: string }
): QueryResponse<T> {
    const [cacheKey, setCacheKey] = useState<string>();
    useEffect(() => {
        if (method !== 'GET') return;
        crypto.subtle.digest('SHA-256', encoder.encode([path].join('\0'))).then((digest) => setCacheKey(toBase64(digest)));
    }, [method, path]);
    const [cached, setCached, clearCache] = useLocalStorage<T>(cacheKey && `cached.${cacheKey}`);
    const res = useQuery<T>((cacheKey || method !== 'GET') ? method : null, path, body, headers);
    useEffect(() => {
        if (res.status === 'success' && res.response) setCached(res.response);
        else if (res.status === 'error') clearCache();
    }, [res.status, res.response, setCached, clearCache]);
    return cached && res.status !== 'success' ? {
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

/** `useQuery<T>` is a generic hook for making `fetch` requests. The type `T` is the type of the response body.
 *
 * ```tsx
 * const { status, response, revalidate, error } = useQuery<{ email: string }>('GET', 'http://example.com/userinfo');
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


export function useQuery<T>(
    /** HTTP request method. Set to `null` to defer the request. */
    method: Method | null,
    /** The path to the API endpoint. Can be a full URL or just a path to a resource on the origin. */
    path: string,
    /** If `body` is a string, it will be sent as the request body. If it is an object, it will be serialized as JSON. */
    body?: Body | string,
    /** If provided, the header will be passed to the request. Make sure that the headers object is memoized and not created per render. */
    headers?: { [key: string]: string }
): QueryResponse<T> {
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
        request<T>(path, { method, body, headers })
            .then(
                ({ response: res, body, error: err }) => {
                    if (cancelled) return;
                    if (res.ok) {
                        setResponse(body);
                        setStatus('success');
                    } else {
                        if (err) setError(err);
                        else setError(new Error((body as any).errorText));
                        setStatus('error');
                    }
                },
                (err) => {
                    setError(err);
                    setStatus('error');
                }
            )
            .catch((e) => {
                console.error(e);
            });
        return () => {
            cancelled = true;
        };
    }, [method, path, body, headers]);

    useEffect(fetchData, [fetchData]);

    return { status, error, response, revalidate: fetchData };
}
