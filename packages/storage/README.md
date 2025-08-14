# @emdgroup/react-storage

## Functions

### useLocalStorage

▸ **useLocalStorage**<`T`\>(`key`, `predicate?`): [`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]

useSessionStorage and useLocalStorage are convenience hooks for
using the localStorage and sessionStorage APIs. The item is JSON
serialized before storing.

```typescript
import { useSessionStorage, useLocalStorage } from '@emdgroup/react-storage';
const [item, setItem, clearItem] = useSessionStorage('my-key');
```

If provided, the `predicate` function is executed against the item
before it is stored or retrieved.

```typescript
interface MyItem {
    name: string;
}

localStorage.setItem('my-key', 'some value');

const [item, setItem, clearItem] = useSessionStorage('my-key', (item: unknown): item is MyItem => {
   return typeof item === 'object' && item !== null && (item as Record<string, unknown>).name === 'string';
});

// `item` is of type MyItem if it passes the predicate. In this case, it is undefined because
// the stored value is invalid.

setItem({ id: 123 }); // fails validation and will not be stored

```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `undefined` \| `string` | The key to store the value under. |
| `predicate?` | (`arg`: `unknown`) => arg is T | A function to determine if the value should be stored. |

#### Returns

[`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]

___

### useSessionStorage

▸ **useSessionStorage**<`T`\>(`key`, `predicate?`): [`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]

`useSessionStorage` uses the sessionStorage API instead of the localStorage API.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `undefined` \| `string` | The key to store the value under. |
| `predicate?` | (`arg`: `unknown`) => arg is T | A function to determine if the value should be stored. |

#### Returns

[`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]

___

### useSyncLocalStorage

▸ **useSyncLocalStorage**<`T`\>(`key`, `predicate?`): [`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]

`useSyncLocalStorage` and `useSyncSessionStorage` are similar to `useLocalStorage` and `useSessionStorage`, but they also
synchronize changes across different components in the application, sharing the same key.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `undefined` \| `string` | The key to store the value under. |
| `predicate?` | (`arg`: `unknown`) => arg is T | A function to determine if the value should be stored. |

#### Returns

[`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]

___

### useSyncSessionStorage

▸ **useSyncSessionStorage**<`T`\>(`key`, `predicate?`): [`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]

`useSyncSessionStorage` uses the sessionStorage API instead of the localStorage API.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `undefined` \| `string` | The key to store the value under. |
| `predicate?` | (`arg`: `unknown`) => arg is T | A function to determine if the value should be stored. |

#### Returns

[`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]
