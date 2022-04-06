## Interfaces

- [LoginOptions](#LoginOptions)
- [ProviderOptions](#ProviderOptions)
- [UserContext](#UserContext)
- [UserInfo](#UserInfo)

## Variables

### UserContext

• **UserContext**: `Context`<[`UserContext`](#usercontext)\>

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

### useUser

▸ **useUser**(): [`UserContext`](#usercontext)

Returns the user context previously established with `UserContextProvider`.

```ts
const { info, session, login, logout, authHeader } = useUser();

useEffect(() => {
  if (!session) return; // user is not logged in
  fetch('/api/pet', { headers: authHeader }).then(...);
}, [session, authHeader]);
```

#### Returns

[`UserContext`](#usercontext)


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

### session

• `Optional` **session**: `UserSession`

Provides the `UserSession` object if the user is authenticated.

## Methods

### login

▸ `Optional` **login**(`opts?`): `void`

Function to initiate the login flow.

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts?` | [`LoginOptions`](#LoginOptions) |

#### Returns

`void`

___

### logout

▸ `Optional` **logout**(): `void`

Function to log the user out.

#### Returns

`void`


## ProviderOptions

## Properties

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

Perform redirect after successful authentication, default to `true`.


## UserInfo

Object representing the user details as provided by the IdP `userInfo` endpoint.

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
