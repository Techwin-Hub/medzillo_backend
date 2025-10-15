import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { dbGet, dbSet } from '../utils/db';

/**
 * @file A custom React hook for state that persists in IndexedDB and syncs across browser tabs.
 */

// A Broadcast Channel to send messages between tabs/windows of the same origin.
const channel = new BroadcastChannel('medzillo_state_sync');

/**
 * A custom React hook that uses IndexedDB for persistence and Broadcast Channel for real-time
 * cross-tab synchronization. It behaves like `useState` but saves the state to the browser's
 * storage and listens for changes from other tabs.
 *
 * @template T The type of the state.
 * @param {string | null} key The unique key for storing the state in IndexedDB. If null, the state is not persisted.
 * @param {T} initialValue The initial value of the state if none is found in storage.
 * @returns {[T, Dispatch<SetStateAction<T>>]} A stateful value and a function to update it.
 */
function usePersistentState<T>(key: string | null, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [state, setState] = useState<T>(initialValue);

    // Effect to read the initial value from IndexedDB when the component mounts or the key changes.
    useEffect(() => {
        // If the key is null (e.g., user is logged out), reset the state to its initial value and do nothing else.
        if (!key) {
            setState(initialValue);
            return;
        }

        let isMounted = true;
        dbGet<T>(key).then(storedValue => {
            if (isMounted) {
                if (storedValue !== undefined) {
                    setState(storedValue);
                } else {
                    // If no value is found in the DB, ensure the component state is the initial value.
                    setState(initialValue);
                }
            }
        }).catch(error => {
            console.error(`Error reading IndexedDB key “${key}”:`, error);
        });

        // Cleanup function to prevent state updates on unmounted components.
        return () => { isMounted = false; };
    }, [key]); // The effect re-runs only when the storage key changes.

    /**
     * An enhanced state setter function that also persists the new value to IndexedDB
     * and broadcasts the change to other tabs.
     */
    const setPersistedState = useCallback((newValue: T | ((prevState: T) => T)) => {
        setState(prevState => {
            const valueToStore = newValue instanceof Function ? newValue(prevState) : newValue;

            // Only perform DB operations if a valid key is provided.
            if (key) {
                dbSet(key, valueToStore).then(() => {
                    // After successfully saving, post a message to other tabs.
                    channel.postMessage({ key, newValue: valueToStore });
                }).catch(error => {
                    console.error(`Error setting IndexedDB key “${key}”:`, error);
                });
            }
            
            return valueToStore;
        });
    }, [key]);
    
    // Effect to listen for messages from other tabs and update the state accordingly.
    useEffect(() => {
        // Do not listen for messages if there is no key (e.g., logged out).
        if (!key) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.key === key) {
                const newValue = event.data.newValue;
                // A simple deep comparison to avoid unnecessary re-renders from its own broadcast.
                if (JSON.stringify(state) !== JSON.stringify(newValue)) {
                   setState(newValue);
                }
            }
        };
        
        channel.addEventListener('message', handleMessage);
        return () => {
            channel.removeEventListener('message', handleMessage);
        };
    }, [key, state]); // Dependency on `state` helps in the comparison logic.

    return [state, setPersistedState as Dispatch<SetStateAction<T>>];
}

export default usePersistentState;
