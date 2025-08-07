import { useState, useCallback } from 'react';

function useStorage<T>(
    /** The storage engine to use. */
    engine: 'localStorage' | 'sessionStorage',
    /** The key to store the value under. */
    key: string | undefined,
    /** A function to determine if the value should be stored. */
    pred?: (arg: unknown) => arg is T
): [T | undefined, (item: T) => void, () => void] {
    const [item, setItem] = useState<T>();

    const provider = typeof window !== 'undefined' ? window[engine] : undefined;

    const updateStorage = useCallback(
        (item: T): void => {
            if (pred !== undefined && !pred(item)) return;
            if (provider && typeof key === 'string') provider.setItem(key, JSON.stringify(item));
            setItem(item);
        },
        [provider, key, pred]
    );

    const clearStorage = useCallback(
        (): void => {
            if (provider &&  typeof key === 'string') provider.removeItem(key);
            setItem(undefined);
        },
        [provider, key]
    );

    if (!item && typeof key === 'string') {
        try {
            const item = provider?.getItem(key) ?? null;
            if (typeof item === 'string') {
                const session = JSON.parse(item);
                if (!pred || pred(session)) {
                    setItem(session);
                    return [session, updateStorage, clearStorage];
                }
            }
        } catch (err) {
        // Nothing to do here, we assume the stored value is invalid
        // and return an empty item.
        }
    }

    return [item, updateStorage, clearStorage];
}



/**
 * useSessionStorage and useLocalStorage are convenience hooks for
 * using the localStorage and sessionStorage APIs. The item is JSON
 * serialized before storing.
 *
 * ```typescript
 * import { useSessionStorage, useLocalStorage } from '@emdgroup/react-storage';
 * const [item, setItem, clearItem] = useSessionStorage('my-key');
 * ```
 *
 * If provided, the `predicate` function is executed against the item
 * before it is stored or retrieved.
 *
 * ```typescript
 * interface MyItem {
 *     name: string;
 * }
 *
 * localStorage.setItem('my-key', 'some value');
 *
 * const [item, setItem, clearItem] = useSessionStorage('my-key', (item: unknown): item is MyItem => {
 *    return typeof item === 'object' && item !== null && (item as Record<string, unknown>).name === 'string';
 * });
 *
 * // `item` is of type MyItem if it passes the predicate. In this case, it is undefined because
 * // the stored value is invalid.
 *
 * setItem({ id: 123 }); // fails validation and will not be stored
 *
 * ```
 *
 */

export function useLocalStorage<T>(
    /** The key to store the value under. */
    key: string | undefined,
    /** A function to determine if the value should be stored. */
    predicate?: (arg: unknown) => arg is T
): [T | undefined, (item: T) => void, () => void] {
    return useStorage('localStorage', key, predicate);
}

/**
 * `useSessionStorage` uses the sessionStorage API instead of the localStorage API.
 */

export function useSessionStorage<T>(
    /** The key to store the value under. */
    key: string | undefined,
    /** A function to determine if the value should be stored. */
    predicate?: (arg: unknown) => arg is T
): [T | undefined, (item: T) => void, () => void] {
    return useStorage('sessionStorage', key, predicate);
}
