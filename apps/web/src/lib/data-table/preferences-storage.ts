const CHANGE_EVENT = 'navis:table-preferences';

/** Lee sin lanzar: `localStorage` puede estar bloqueado (ventana privada, permisos). */
export function readRawPreferences(key: string): string | null {
    try {
        return globalThis.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeRawPreferences(key: string, value: string | null): void {
    try {
        if (value === null) globalThis.localStorage.removeItem(key);
        else globalThis.localStorage.setItem(key, value);
    } catch {
        // Sin almacenamiento la tabla sigue funcionando: solo no recuerda.
    }
    // `storage` solo salta en las **otras** pestañas: la de quien escribe se avisa a mano.
    globalThis.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Para `useSyncExternalStore`: esta pestaña y las demás. */
export function subscribeToPreferences(onChange: () => void): () => void {
    globalThis.addEventListener('storage', onChange);
    globalThis.addEventListener(CHANGE_EVENT, onChange);
    return () => {
        globalThis.removeEventListener('storage', onChange);
        globalThis.removeEventListener(CHANGE_EVENT, onChange);
    };
}
