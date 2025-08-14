## Interfaces

- [LoginOptions](#LoginOptions)
- [ProviderOptions](#ProviderOptions)
- [UserContext](#UserContext)
- [UserInfo](#UserInfo)
- [UserSession](#UserSession)

## Functions

### UserContextProvider

▸ **UserContextProvider**(`__namedParameters`): `JSX.Element`

This library implements the Authorization Code Grant Flow with PKCE.

```tsx
import { UserContextProvider } from '@emdgroup/react-auth';
function App(): JSX.Element {
  return (
    <UserContextProvider autoLogin clientId="...">
      <Content />
    </UserContextProvider>
  );
}

function Content(): JSX.Element {
  const { info } = useUser();
  return <p>{info.email}</p>;
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | [`ProviderOptions`](#ProviderOptions) |

#### Returns

`JSX.Element`

___

### getAccessToken

▸ **getAccessToken**(`__namedParameters`): `Promise`<`string`\>

Return a valid access token for the current user. If the stored session is expired and a refresh token
is available, the function attempts to refresh the session automatically. If the user is not authenticated,
it rejects with an error. On refresh failure, the stored session is cleared.

```ts
const token = await getAccessToken({
  idpHost: 'login.emddigital.com',
  clientId: 'my-client-id',
});
fetch('/api/resource', { headers: { Authorization: `Bearer ${token}` } });
```

**`Throws`**

Error when the user is not authenticated (no stored session).

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.clientId` | `string` |
| `__namedParameters.idpHost` | `string` |
| `__namedParameters.signal?` | `AbortSignal` |

#### Returns

`Promise`<`string`\>

Promise that resolves to a bearer access token string.

___

### refreshSession

▸ **refreshSession**(`__namedParameters`): `Promise`<[`UserSession`](#UserSession)\>

Exchange a refresh token for a new session using the OAuth 2.0 refresh_token grant.

This function deduplicates concurrent calls: multiple invocations while a refresh is in progress
will share the same promise. On success, it updates localStorage with the new session and emits
a storage event to synchronize other tabs/components.

```ts
const session = await refreshSession({
  idpHost: 'login.emddigital.com',
  clientId: 'my-client-id',
  refreshToken,
});
// session.accessToken, session.expires, ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.clientId` | `string` |
| `__namedParameters.idpHost` | `string` |
| `__namedParameters.refreshToken` | `string` |
| `__namedParameters.signal?` | `AbortSignal` |

#### Returns

`Promise`<[`UserSession`](#UserSession)\>

Promise that resolves to the renewed UserSession.

___

### useUser

▸ **useUser**(): `UserContext`

Returns the user context previously established with `UserContextProvider`.

```ts
const { info, session, login, logout, authHeader } = useUser();

useEffect(() => {
  if (!session) return; // user is not logged in
  fetch('/api/pet', { headers: authHeader }).then(...);
}, [session, authHeader]);
```

#### Returns

`UserContext`


## UserContext

The user context object is returned by the `useUser` hook.

## Properties

### authHeader

• `Optional` **authHeader**: `Object`

Convenience header object containing the `Authorization` header value set to the access token.

#### Index signature

▪ [key: `string`]: `string`

___

### info

• `Optional` **info**: [`UserInfo`](#UserInfo)

Provides the `UserInfo` object if the user is authenticated.

___

### login

• `Optional` **login**: (`opts?`: [`LoginOptions`](#LoginOptions)) => `void`

#### Type declaration

▸ (`opts?`): `void`

Function to initiate the login flow.

##### Parameters

| Name | Type |
| :------ | :------ |
| `opts?` | [`LoginOptions`](#LoginOptions) |

##### Returns

`void`

___

### loginUrl

• `Optional` **loginUrl**: `string`

Set to the URL that the user is redirected to initiate the authorization flow. Useful when you need to start the login flow in a separate window or tab. Use in combination with `login({ refresh: false })`.

___

### logout

• `Optional` **logout**: () => `void`

#### Type declaration

▸ (): `void`

Function to log the user out.

##### Returns

`void`

___

### session

• `Optional` **session**: [`UserSession`](#UserSession)

Provides the `UserSession` object if the user is authenticated.


## ProviderOptions

## Properties

### acrValues

• `Optional` **acrValues**: `string`

Request a type of multi-factor authentication. Currently, `mfa` is the only supported value.

___

### additionalParameters

• `Optional` **additionalParameters**: `string`

Additional query parameters, such as `state=xyz`.

___

### autoLogin

• `Optional` **autoLogin**: `boolean`

When enabled, the user will automatically be logged in when the page is loaded. Defaults to `false`.

___

### clientId

• **clientId**: `string`

Client ID as provided by the IdP.

___

### domainHint

• `Optional` **domainHint**: `string`

Domain name to directly forward a user to the login page for a certain auth domain.

___

### idpHost

• `Optional` **idpHost**: `string`

Overwrite the IdP host, defaults to `login.emddigital.com`.

___

### prompt

• `Optional` **prompt**: ``"login"``

Whether the authorization server prompts the user for re-authentication.

___

### redirectUri

• `Optional` **redirectUri**: `string`

Overwrite the redirect URI, defaults to the current hostname + `/auth`.

___

### refreshSession

• `Optional` **refreshSession**: `boolean`

Persist and use the refreshToken to renew an expired accessToken. Defaults to `false`.

___

### userInfoEndpoint

• `Optional` **userInfoEndpoint**: `string`

Overwrite the userinfo endpoint, defaults to `/oauth2/userinfo`.


## LoginOptions

Object representing the options for the login function of the UserContext.

## Properties

### entrypoint

• `Optional` **entrypoint**: `string`

Entrypoint to redirect the user to after successful authentication. Defaults to the URL that the user initially visited.

___

### redirect

• `Optional` **redirect**: `boolean`

Automatically redirect the user to the login URL and to the entrypoint after successful authentication. Disabling this will disable all redirects. Defaults to `false`.


## UserSession

Object containing the OIDC tokens and expiration time.

## Properties

### accessToken

• **accessToken**: `string`

OAuth access token provided by the IDP

___

### expires

• **expires**: `number`

Epoch time in seconds when the access token expires

___

### idToken

• `Optional` **idToken**: `string`

OAuth ID token provided by the IDP

___

### refreshToken

• `Optional` **refreshToken**: `string`

OAuth refresh token provided by the IDP


## UserInfo

Object representing the user details as provided by the IdP `userInfo` endpoint.

## Hierarchy

- `Record`<`string`, `unknown`\>

  ↳ **`UserInfo`**

## Properties

### email

• **email**: `string`

Email address

___

### familyName

• `Optional` **familyName**: `string`

Family name of provided

___

### givenName

• `Optional` **givenName**: `string`

Given name of provided

___

### sub

• **sub**: `string`

Subject identifier
