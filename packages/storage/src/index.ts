import { useState, useCallback, useEffect } from 'react';

const localChanges = new EventTarget();

export function setItem<T>({
    provider,
    key,
    item,
    predicate,
    sync,
}: {
    provider: Storage | undefined;
    key: string | undefined;
    item: T;
    predicate?: (arg: unknown) => arg is T;
    sync?: boolean;
}): void {
    if (predicate && !predicate(item)) return;
    if (provider && typeof key === 'string') provider.setItem(key, JSON.stringify(item));
    if (sync) {
        localChanges.dispatchEvent(new StorageEvent('storage', {
            key,
            storageArea: provider,
            newValue: JSON.stringify(item),
            oldValue: null,
        }));
    }
}

export function clearItem({
    provider,
    key,
    sync,
}: {
    provider: Storage | undefined;
    key: string | undefined;
    sync?: boolean;
}): void {
    if (provider && typeof key === 'string') provider.removeItem(key);
    if (sync) {
        localChanges.dispatchEvent(new StorageEvent('storage', {
            key,
            storageArea: provider,
            newValue: null,
            oldValue: null,
        }));
    }
}

export function getItem<T>({
    provider,
    key,
    predicate,
}: {
    provider: Storage | undefined;
    key: string | undefined;
    predicate?: (arg: unknown) => arg is T;
}): T | undefined {
    if (typeof key !== 'string' || !provider) return undefined;
    const item = provider.getItem(key);
    if (item === null) return undefined;
    try {
        const parsed = JSON.parse(item);
        if (!predicate || predicate(parsed)) {
            return parsed as T;
        }
    } catch {
        // Ignore malformed JSON or invalid values
    }
    return undefined;
}

function useStorage<T>({
    engine,
    key,
    predicate,
    sync = false,
}: {
    /** The storage engine to use. */
    engine: 'localStorage' | 'sessionStorage';
    /** The key to store the value under. */
    key: string | undefined;
    /** A function to determine if the value should be stored. */
    predicate?: (arg: unknown) => arg is T;
    /** Whether to sync with other tabs/windows. */
    sync?: boolean;
}): [T | undefined, (item: T) => void, () => void] {
    const [item, setLocalItem] = useState<T>();

    const provider = typeof window !== 'undefined' ? window[engine] : undefined;

    const updateStorageCb = useCallback(
        (item: T): void => setItem({ provider, key, item, predicate, sync }),
        [provider, key, predicate, sync]
    );

    const clearStorageCb = useCallback(
        (): void => clearItem({ provider, key, sync }),
        [provider, key, sync]
    );

    useEffect(() => {
        if (sync === false || typeof window === 'undefined' || typeof key !== 'string') return;

        const handler = (e: StorageEvent) => {
            try {
                // Ensure this event is for the same storage area and key
                if (e.storageArea !== provider) return;
                if (e.key !== key) return;

                if (e.newValue === null) {
                    setLocalItem(undefined);
                    return;
                }

                const parsed = JSON.parse(e.newValue);
                if (!predicate || predicate(parsed)) {
                    setLocalItem(parsed as T);
                }
            } catch {
                // Ignore malformed JSON or invalid values
            }
        };

        window.addEventListener('storage', handler);
        localChanges.addEventListener('storage', handler as EventListener);
        return () => {
            window.removeEventListener('storage', handler);
            localChanges.removeEventListener('storage', handler as EventListener);
        };
    }, [provider, key, predicate, sync]);

    if (item === undefined && typeof key === 'string') {
        const fromStorage = getItem<T>({ provider, key, predicate });
        return [fromStorage, updateStorageCb, clearStorageCb];
    }

    return [item, updateStorageCb, clearStorageCb];
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
    return useStorage({ engine: 'localStorage', key, predicate });
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
    return useStorage({ engine: 'sessionStorage', key, predicate });
}

/**
 * `useSyncLocalStorage` and `useSyncSessionStorage` are similar to `useLocalStorage` and `useSessionStorage`, but they also
 * synchronize changes across different components in the application, sharing the same key.
 */

export function useSyncLocalStorage<T>(
    /** The key to store the value under. */
    key: string | undefined,
    /** A function to determine if the value should be stored. */
    predicate?: (arg: unknown) => arg is T
): [T | undefined, (item: T) => void, () => void] {
    return useStorage({ engine: 'localStorage', key, predicate, sync: true });
}

/**
 * `useSyncSessionStorage` uses the sessionStorage API instead of the localStorage API.
 */

export function useSyncSessionStorage<T>(
    /** The key to store the value under. */
    key: string | undefined,
    /** A function to determine if the value should be stored. */
    predicate?: (arg: unknown) => arg is T
): [T | undefined, (item: T) => void, () => void] {
    return useStorage({ engine: 'sessionStorage', key, predicate, sync: true });
}
