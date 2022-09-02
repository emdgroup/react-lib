# @emdgroup/react-query

React hooks for the fetch API with support for client-side caching

Usage:

```tsx
import { useCachedQuery, isHTTPError } from '@emdgroup/react-query';

const { status, response, revalidate, error } = useCachedQuery<{ email: string }>('http://example.com/userinfo');

function Profile() {
  if (status === 'loading') return 'Loading';
  if (isHTTPError(error, 404)) return 'Not found';
  if (error) return 'Unknown error';
  return `Hello ${response?.email}`;
}

## Lazy Queries

To enable a query at a later time (for example if the query depends on a previous query),
the method can be set to `null` which will effectively defer the query until the query
method is defined.

function ToDos() {
  const [filter, setFilter] = useState(false);
  const { response } = useQuery('/todos', { method: filter ? 'GET' : null });

  // ...
}
```

## Hooks

* [useCachedQuery](#usecachedquery)
* [useQuery](#usequery)
* [useOnlineStatus](#useonlinestatus)

## Functions

* [isHTTPError](#ishttperror)

## Classes

- [HTTPError](#HTTPError)

## Interfaces

- [QueryResponse](#QueryResponse)
- [RequestOptions](#RequestOptions)

## Type Aliases

### QueryStatus

Ƭ **QueryStatus**: ``"success"`` \| ``"loading"`` \| ``"error"`` \| ``"idle"``

Status of the request. Starts out with `idle`, then transitions from `loading`
to either `success` or `error`.

## Variables

### querystring

• `Const` **querystring**: `Object` = `qs`

Implementation of the [NodeJS `querystring`](https://nodejs.org/docs/latest-v12.x/api/querystring.html) module for the browser.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `decode` | (`str?`: `string`, `sep`: `string`, `eq`: `string`, `options`: `ParseOptions`) => `ParsedUrlQuery` |
| `encode` | (`obj?`: `ParsedUrlQueryInput`, `sep`: `string`, `eq`: `string`) => `string` |
| `parse` | (`str?`: `string`, `sep`: `string`, `eq`: `string`, `options`: `ParseOptions`) => `ParsedUrlQuery` |
| `stringify` | (`obj?`: `ParsedUrlQueryInput`, `sep`: `string`, `eq`: `string`) => `string` |

## Functions

### isHTTPError

▸ **isHTTPError**(`error`, `status?`): error is HTTPError

Type guard for the error response returned by the `useQuery` and `useCachedQuery` hooks.
The function returns true if the server returns an HTTP error with an error code. A Network error
is not an HTTP error and will not return true when passed to this function.

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |
| `status?` | `number` |

#### Returns

error is HTTPError

___

### sleep

▸ **sleep**(`ms`, `signal?`): `Promise`<`void`\>

Sleep function that supports an optional [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal). If the signal is aborted
the returned Promise will immediately reject with a `DOMException` and name `AbortError`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `ms` | `number` |
| `signal?` | ``null`` \| `AbortSignal` |

#### Returns

`Promise`<`void`\>

___

### useCachedQuery

▸ **useCachedQuery**<`T`\>(`path`, `request`): [`QueryResponse`](#QueryResponse)<`T`\>

`useCachedQuery` accepts the same parameters as [`useQuery`](#usequery). It will
immediately return the cached result if it exists for `GET` requests and set the
`status` to `success`. The request will still be performed and the response is
updated once the request is complete. Any failed request will clear the cache.

The response is cached in the browser's localStorage (if available).

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `request` | [`RequestOptions`](#RequestOptions) |

#### Returns

[`QueryResponse`](#QueryResponse)<`T`\>

___

### useOnlineStatus

▸ **useOnlineStatus**(): `boolean`

`useOnlineStatus` will return a boolean that indicates if the user is currently online. This useful
if you want to prevent the browser to make requests or redirects that will fail. Note that this
is not a reliable way to determine if the user is online. See
[`navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) for more details.

This hook will listen to changes to the online status and will update accordingly.

```ts
const online = useOnlineStatus();
```

#### Returns

`boolean`

___

### useQuery

▸ **useQuery**<`T`\>(`path`, `request`): [`QueryResponse`](#QueryResponse)<`T`\>

`useQuery<T>` is a generic hook for making `fetch` requests. The type `T` is the type of the response body.

```tsx
const { status, response, revalidate, error } = useQuery<{ email: string }>('http://example.com/userinfo');

useEffect(() => {
   if (status === 'success') {
     // do something with response
   } if (status === 'error') {
    // do something with error
   }
}, [status, response, error]);

return status === 'success' ? (<p>Email: {response.email}</p>) : (<p>Loading</p>);
```

For authenticated requests that require a custom header, consider creating a custom hook that passes the
header using a `useMemo` hook:

```ts
function useApi<T>(...[method, path, body]: Parameters<typeof useQuery>) {
  const { token } = useUser();
  const header = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  return useQuery<T>(method, path, body, header);
}
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `request` | [`RequestOptions`](#RequestOptions) |

#### Returns

[`QueryResponse`](#QueryResponse)<`T`\>


## RequestOptions

The request options extends the options from the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) with `retry`, `retryMs` and `queryParameters`.

## Properties

### body

• `Optional` **body**: `Body`

A BodyInit object or null to set request's body.  If the body is a plain object it will be serialized as JSON.

___

### cache

• `Optional` **cache**: `RequestCache`

A string indicating how the request will interact with the browser's cache to set request's cache.

___

### credentials

• `Optional` **credentials**: `RequestCredentials`

A string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. Sets request's credentials.

___

### headers

• `Optional` **headers**: `HeadersInit`

A Headers object, an object literal, or an array of two-item arrays to set request's headers.

___

### integrity

• `Optional` **integrity**: `string`

A cryptographic hash of the resource to be fetched by request. Sets request's integrity.

___

### keepalive

• `Optional` **keepalive**: `boolean`

A boolean to set request's keepalive.

___

### method

• `Optional` **method**: ``null`` \| `string`

A string to set request's method.

___

### mode

• `Optional` **mode**: `RequestMode`

A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request's mode.

___

### queryParameters

• `Optional` **queryParameters**: `URLSearchParams` \| `Record`<`string`, `string`\>

Optional query parameters that will be encoded and appended to the URL.

___

### redirect

• `Optional` **redirect**: `RequestRedirect`

A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request's redirect.

___

### referrer

• `Optional` **referrer**: `string`

A string whose value is a same-origin URL, "about:client", or the empty string, to set request's referrer.

___

### referrerPolicy

• `Optional` **referrerPolicy**: `ReferrerPolicy`

A referrer policy to set request's referrerPolicy.

___

### retry

• `Optional` **retry**: `number`

Number of times a request with a 429 status code us retried. Defaults to 3.

___

### retryMs

• `Optional` **retryMs**: `number`

Milliseconds to wait before the next request is retried. Subsequent requests will be multiplied by `Math.LOG2E`. A random jitter of 50% of the `retryMs` value is applied.

___

### signal

• `Optional` **signal**: ``null`` \| `AbortSignal`

An AbortSignal to set request's signal.

___

### window

• `Optional` **window**: ``null``

Can only be null. Used to disassociate request from any Window.


## QueryResponse

Response object returned from `useQuery` and `useCachedQuery`.

## Type parameters

| Name |
| :------ |
| `T` |

## Properties

### error

• `Optional` **error**: `Error`

Error object, available when status is `error`.

___

### response

• `Optional` **response**: `T`

Response object from the server.

___

### revalidate

• **revalidate**: () => `void`

#### Type declaration

▸ (): `void`

Function to call to request a refresh of the query.

##### Returns

`void`

___

### status

• `Optional` **status**: [`QueryStatus`](#querystatus)

Status of the request.


# HTTPError

If the server responds with an HTTP error (status code > 399) then a `HTTPError` exception is thrown.

## Hierarchy

- `Error`

  ↳ **`HTTPError`**

## Properties

### response

• **response**: `any`

The response body if available.

___

### status

• **status**: `number`

HTTP status code of the error response.

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace
