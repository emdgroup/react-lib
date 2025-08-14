import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
} from 'react';

import { useQuery, useWindowFocus, useCachedQuery, request } from '@emdgroup/react-query';
import { useSyncLocalStorage, useSessionStorage, setItem, getItem, clearItem } from '@emdgroup/react-storage';

async function generateVerifier(size = 32): Promise<Uint8Array> {
    const randomBytes = new Uint8Array(size);
    return crypto.getRandomValues(randomBytes);
}

function sha256(arr: string | Uint8Array): Promise<ArrayBuffer> {
    return crypto.subtle.digest('SHA-256', typeof arr === 'string' ? new TextEncoder().encode(arr) : arr);
}

function base64encode(str: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * ## UserSession
 *
 * Object containing the OIDC tokens and expiration time.
 */
export interface UserSession {
    /** OAuth access token provided by the IDP */
    accessToken: string;
    /** OAuth refresh token provided by the IDP */
    refreshToken?: string;
    /** OAuth ID token provided by the IDP */
    idToken?: string;
    /** Epoch time in seconds when the access token expires */
    expires: number;
}

function isObject(args: unknown): args is Record<string, unknown> {
    return args !== undefined && args !== null && typeof args === 'object';
}

function isSession(args: unknown): args is UserSession {
    return isObject(args) &&
        typeof args.accessToken === 'string' &&
        isStringOrUndefined(args.refreshToken) &&
        isStringOrUndefined(args.idToken) &&
        typeof args.expires === 'number';
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface IdpErrorResponse {
  error: string;
  error_description: string;
}

function isStringOrUndefined(arg: unknown): arg is string | undefined | null {
    return typeof arg === 'string' || arg === undefined || arg === null;
}

function isTokenResponse(args: unknown): args is TokenResponse {
    return isObject(args) &&
        typeof args.access_token === 'string' &&
        isStringOrUndefined(args.refresh_token) &&
        isStringOrUndefined(args.id_token) &&
        typeof args.token_type === 'string' &&
        typeof args.expires_in === 'number';
}

function isIdpErrorResponse(args: unknown): args is IdpErrorResponse {
    return isObject(args) &&
        typeof args.error === 'string' &&
        typeof args.error_description === 'string';
}

function isString(arg: unknown): arg is string {
    return typeof arg === 'string';
}

/**
 * ## LoginOptions
 *
 * Object representing the options for the login function of the UserContext.
 */
export interface LoginOptions {
    /** Entrypoint to redirect the user to after successful authentication. Defaults to the URL that the user initially visited. */
    entrypoint?: string;
    /** Automatically redirect the user to the login URL and to the entrypoint after successful authentication. Disabling this will disable all redirects. Defaults to `false`. */
    redirect?: boolean;
}

/**
 * ## UserInfo
 *
 * Object representing the user details as provided by the IdP `userInfo` endpoint.
 */

export interface UserInfo extends Record<string, unknown> {
    /** Email address */
    email: string;
    /** Given name of provided */
    givenName?: string;
    /** Family name of provided */
    familyName?: string;
    /** Subject identifier */
    sub: string;
}

/**
 * ## UserContext
 *
 * The user context object is returned by the `useUser` hook.
 */
export interface UserContext {
    /** Provides the `UserInfo` object if the user is authenticated. */
    info?: UserInfo;
    /** Provides the `UserSession` object if the user is authenticated. */
    session?: UserSession;
    /** Function to initiate the login flow. */
    login?: (opts?: LoginOptions) => void;
    /** Function to log the user out. */
    logout?: () => void;
    /** Convenience header object containing the `Authorization` header value set to the access token. */
    authHeader?: { [key: string]: string };
    /** Set to the URL that the user is redirected to initiate the authorization flow. Useful when you need to start the login flow in a separate window or tab. Use in combination with `login({ refresh: false })`. */
    loginUrl?: string;
}

export const UserContext = createContext<UserContext>({});

/** ## ProviderOptions */

export interface ProviderOptions {
    /** When enabled, the user will automatically be logged in when the page is loaded. Defaults to `false`. */
    autoLogin?: boolean;
    children: React.ReactNode;
    /** Client ID as provided by the IdP. */
    clientId: string;
    /** Domain name to directly forward a user to the login page for a certain auth domain. */
    domainHint?: string;
    /** Overwrite the IdP host, defaults to `login.emddigital.com`. */
    idpHost?: string;
    /** Overwrite the userinfo endpoint, defaults to `/oauth2/userinfo`. */
    userInfoEndpoint?: string;
    /** Overwrite the redirect URI, defaults to the current hostname + `/auth`. */
    redirectUri?: string;
    /** Persist and use the refreshToken to renew an expired accessToken. Defaults to `false`. */
    refreshSession?: boolean;
    /** Whether the authorization server prompts the user for re-authentication. */
    prompt?: 'login';
    /** Request a type of multi-factor authentication. Currently, `mfa` is the only supported value. */
    acrValues?: string;
    /** Additional query parameters, such as `state=xyz`. */
    additionalParameters?: string;
}

/**
 * This library implements the Authorization Code Grant Flow with PKCE.
 *
 * ```tsx
 * import { UserContextProvider } from '@emdgroup/react-auth';
 * function App(): JSX.Element {
 *   return (
 *     <UserContextProvider autoLogin clientId="...">
 *       <Content />
 *     </UserContextProvider>
 *   );
 * }
 *
 * function Content(): JSX.Element {
 *   const { info } = useUser();
 *   return <p>{info.email}</p>;
 * }
 * ```
 */

export function UserContextProvider({
    autoLogin = false,
    children,
    clientId,
    domainHint,
    idpHost = 'login.emddigital.com',
    userInfoEndpoint = '/oauth2/userinfo',
    redirectUri,
    refreshSession: refreshSessionOpt = false,
    prompt,
    acrValues,
    additionalParameters,
}: ProviderOptions): JSX.Element {
    const [session, updateSession, clearSession] = useSyncLocalStorage('session', isSession);

    const [code, setCode] = useState<string>();

    const [key, setKey, clearKey] = useSessionStorage('pkceKey', isString);

    const [entrypoint, setEntrypoint, clearEntrypoint] = useSessionStorage('entrypoint', isString);

    const [userInfo, setUserInfo] = useState<UserInfo>();

    const [loginUrl, setLoginUrl] = useState<string>();
    const login = useCallback(async (
        { entrypoint, redirect = true }: LoginOptions = {}
    ): Promise<void> => {
        const newKey = await generateVerifier();
        const encodedKey = base64encode(newKey);
        setKey(encodedKey);
        if (redirect) {
            // make sure to keep query string and hash
            setEntrypoint(entrypoint || document.location.href.slice(document.location.origin.length));
        }
        const challenge = base64encode(await sha256(encodedKey));

        const queryString = new URLSearchParams({
            client_id: clientId,
            domain_hint: domainHint ?? '',
            response_type: 'code',
            scope: 'openid email',
            redirect_uri: redirectUri || `${document.location.origin}/auth`,
            code_challenge_method: 'S256',
            code_challenge: challenge,
            prompt: prompt ?? '',
            acr_values: acrValues ?? '',
        });

        if (additionalParameters) {
            const additionalParams = new URLSearchParams(additionalParameters);
            for (const [key, value] of additionalParams.entries()) {
                queryString.set(key, value);
            }
        }

        const url = `https://${idpHost}/oauth2/authorize?` + queryString;

        setLoginUrl(url);

        if (redirect) document.location.href = url;
    }, [setKey, idpHost, clientId, domainHint, redirectUri, setEntrypoint, prompt, acrValues, additionalParameters]);

    const logout = useCallback((): void => {
        clearSession();
        setUserInfo(undefined);
    }, [clearSession]);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const { status: tokenStatus, response: tokenResponse } = useQuery<TokenResponse>(
        code && key ? 'POST' : null,
        `https://${idpHost}/oauth2/token`,
        new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            code_verifier: key ?? '',
            code: code ?? '',
            redirect_uri: redirectUri || `${origin}/auth`,
        }).toString(),
        useMemo(
            () => ({
                'content-type': 'application/x-www-form-urlencoded',
            }),
            []
        )
    );

    useEffect(() => {
        if (!session && tokenStatus === 'success' && isTokenResponse(tokenResponse)) {
            clearKey();
            setLoginUrl(undefined);
            updateSession({
                accessToken: tokenResponse.access_token,
                refreshToken: refreshSessionOpt ? tokenResponse.refresh_token : undefined,
                idToken: tokenResponse.id_token,
                expires: Date.now() + tokenResponse.expires_in * 1000,
            });
            if (code && entrypoint) {
                clearEntrypoint();
                document.location.replace(entrypoint);
            }
        }
    }, [
        session,
        clearEntrypoint,
        clearKey,
        setLoginUrl,
        tokenStatus,
        tokenResponse,
        entrypoint,
        code,
        updateSession,
        refreshSessionOpt,
    ]);

    const authHeader = useMemo((): Record<string, string> => (session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}), [session?.accessToken]);

    const { status: userInfoStatus, response: userInfoResponse, revalidate } = useCachedQuery<any>(
        session && session.expires > Date.now() && !code ? 'GET' : null,
        userInfoEndpoint.startsWith('/') ? `https://${idpHost}${userInfoEndpoint}` : userInfoEndpoint,
        undefined,
        authHeader,
    );

    useEffect(() => {
        if (refreshSessionOpt && session?.refreshToken && (session.expires <= Date.now() || userInfoStatus === 'error'))
            refreshSession({
                clientId,
                idpHost,
                refreshToken: session.refreshToken,
            }).catch(() => clearSession());
    }, [session, clearSession, refreshSessionOpt, clientId, idpHost, userInfoStatus]);


    useWindowFocus(revalidate);

    useEffect(() => {
        if (!userInfo && (userInfoStatus === 'success')) {
            setUserInfo({
                familyName: userInfoResponse.family_name,
                givenName: userInfoResponse.given_name,
                ...userInfoResponse,
            });
        }
    }, [userInfo, userInfoStatus, setUserInfo, userInfoResponse]);

    useEffect(() => {
        if (session) return;
        else if (
            document.location.href.startsWith(redirectUri ?? `${document.location.origin}/auth`) &&
            document.location.search.length > 1
        ) {
            const idpResponse = new URLSearchParams(document.location.search.slice(1));
            const code = idpResponse.get('code');
            if (code) setCode(code);
        }
        else if (autoLogin) login();
    }, [session, autoLogin, clearSession, login, redirectUri]);

    return (
        <UserContext.Provider
            value={useMemo(() => {
                return {
                    info: userInfo,
                    session,
                    login,
                    logout,
                    authHeader,
                    loginUrl,
                };
            }, [session, userInfo, login, logout, authHeader, loginUrl])}
        >{!autoLogin || userInfo ? children : null}</UserContext.Provider>
    );
}

/**
 * Returns the user context previously established with `UserContextProvider`.
 *
 * ```ts
 * const { info, session, login, logout, authHeader } = useUser();
 *
 * useEffect(() => {
 *   if (!session) return; // user is not logged in
 *   fetch('/api/pet', { headers: authHeader }).then(...);
 * }, [session, authHeader]);
 * ```
 */

export function useUser(): UserContext {
    return useContext(UserContext);
}

let refreshSessionPromise: Promise<UserSession> | undefined;

/**
 * Exchange a refresh token for a new session using the OAuth 2.0 refresh_token grant.
 *
 * This function deduplicates concurrent calls: multiple invocations while a refresh is in progress
 * will share the same promise. On success, it updates localStorage with the new session and emits
 * a storage event to synchronize other tabs/components.
 *
 * ```ts
 * const session = await refreshSession({
 *   idpHost: 'login.emddigital.com',
 *   clientId: 'my-client-id',
 *   refreshToken,
 * });
 * // session.accessToken, session.expires, ...
 * ```
 *
 * @param signal Optional AbortSignal to cancel the network request.
 * @param idpHost Authorization server host, e.g. "login.emddigital.com".
 * @param clientId OAuth client identifier registered with the IdP.
 * @param refreshToken Refresh token obtained during the initial authorization code exchange.
 * @returns Promise that resolves to the renewed UserSession.
 */
export async function refreshSession({
    signal,
    idpHost,
    clientId,
    refreshToken,
}: {
    signal?: AbortSignal;
    idpHost: string;
    clientId: string;
    refreshToken: string;
}): Promise<UserSession> {
    if (refreshSessionPromise) return refreshSessionPromise;

    refreshSessionPromise = _refreshSession({ signal, idpHost, clientId, refreshToken });

    return refreshSessionPromise.finally(() => {
        refreshSessionPromise = undefined;
    });
}

async function _refreshSession({ signal, idpHost, clientId, refreshToken }: { signal?: AbortSignal; idpHost: string; clientId: string; refreshToken: string }) {
    const { body, error } = await request<TokenResponse>(`https://${idpHost}/oauth2/token`, {
        signal,
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            refresh_token: refreshToken,
        }).toString(),
    });
    if (isTokenResponse(body)) {
        const session: UserSession = {
            accessToken: body.access_token,
            refreshToken: body.refresh_token,
            idToken: body.id_token,
            expires: Date.now() + body.expires_in * 1000,
        };
        setItem<UserSession>({
            provider: localStorage,
            key: 'session',
            item: session,
            sync: true,
        });
        return session;
    } else {
        throw error;
    }
}

let getAccessTokenPromise: Promise<string> | undefined;
/**
 * Return a valid access token for the current user. If the stored session is expired and a refresh token
 * is available, the function attempts to refresh the session automatically. If the user is not authenticated,
 * it rejects with an error. On refresh failure, the stored session is cleared.
 *
 * ```ts
 * const token = await getAccessToken({
 *   idpHost: 'login.emddigital.com',
 *   clientId: 'my-client-id',
 * });
 * fetch('/api/resource', { headers: { Authorization: `Bearer ${token}` } });
 * ```
 *
 * @param signal Optional AbortSignal to cancel the request.
 * @param idpHost Authorization server host, e.g. "login.emddigital.com".
 * @param clientId OAuth client identifier registered with the IdP.
 * @returns Promise that resolves to a bearer access token string.
 * @throws Error when the user is not authenticated (no stored session).
 */
export async function getAccessToken({
    signal,
    idpHost,
    clientId,
}: {
    signal?: AbortSignal;
    idpHost: string;
    clientId: string;
}): Promise<string> {
    if (getAccessTokenPromise) return getAccessTokenPromise;

    getAccessTokenPromise = _getAccessToken({ signal, idpHost, clientId });

    return getAccessTokenPromise.finally(() => {
        getAccessTokenPromise = undefined;
    });
}

async function _getAccessToken({ signal, idpHost, clientId }: { signal?: AbortSignal; idpHost: string; clientId: string }) {
    const session = getItem<UserSession>({
        provider: localStorage,
        key: 'session',
        predicate: isSession,
    });
    if (!session) throw new Error('User is not authenticated');
    if (session.expires <= Date.now() && session.refreshToken) {
        const newSession = await refreshSession({
            signal,
            idpHost,
            clientId,
            refreshToken: session.refreshToken,
        }).catch(() => null);
        if (newSession) {
            return newSession.accessToken;
        } else {
            clearItem({
                provider: localStorage,
                key: 'session',
                sync: true,
            });
            throw new Error('User is not authenticated');
        }
    }
    return session.accessToken;
}
