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

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `predicate?` | (`arg`: `unknown`) => arg is T |

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

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `predicate?` | (`arg`: `unknown`) => arg is T |

#### Returns

[`T` \| `undefined`, (`item`: `T`) => `void`, () => `void`]
