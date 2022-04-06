## Interfaces

- [QueryResponse](#QueryResponse)

## Type aliases

### QueryStatus

Ƭ **QueryStatus**: ``"success"`` \| ``"loading"`` \| ``"error"`` \| ``"idle"``

Status of the request. Starts out with `idle`, then transitions from `loading`
to either `success` or `error`.

## Variables

### querystring

• `Const` **querystring**: `Object` = `qs`

Implementation of the [NodeJS `querystring`](https://nodejs.org/docs/latest-v12.x/api/querystring.html) module for the browser.

## Functions

### useCachedQuery

▸ **useCachedQuery**<`T`\>(`method`, `path`, `body?`, `headers?`): [`QueryResponse`](#QueryResponse)<`T`\>

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
| `method` | ``null`` \| `Method` |
| `path` | `string` |
| `body?` | `string` \| `Body` |
| `headers?` | `Object` |

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

▸ **useQuery**<`T`\>(`method`, `path`, `body?`, `headers?`): [`QueryResponse`](#QueryResponse)<`T`\>

`useQuery<T>` is a generic hook for making `fetch` requests. The type `T` is the type of the response body.

```tsx
const { status, response, revalidate, error } = useQuery<{ email: string }>('GET', 'http://example.com/userinfo');

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
| `method` | ``null`` \| `Method` |
| `path` | `string` |
| `body?` | `string` \| `Body` |
| `headers?` | `Object` |

#### Returns

[`QueryResponse`](#QueryResponse)<`T`\>


Response object returned from `useQuery` and `useCachedQuery`.

## Type parameters

| Name |
| :------ |
| `T` |

## Properties

### error

• `Optional` **error**: `Error`

error object

___

### response

• `Optional` **response**: `T`

Response object from the server

___

### status

• `Optional` **status**: [`QueryStatus`](#querystatus)

Status of the request

## Methods

### revalidate

▸ **revalidate**(): `void`

Function to call to request a refresh of the query

#### Returns

`void`
