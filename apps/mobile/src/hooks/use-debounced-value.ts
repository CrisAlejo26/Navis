import { useEffect, useState } from 'react';

/**
 * Retarda un valor que cambia rápido (lo que se escribe en un buscador) antes
 * de que dispare una consulta. Sin esto, cada pulsación relanza
 * `useBelievers` sobre SQLite: varias llamadas nativas solapadas en el mismo
 * `expo-sqlite` reventaban con «Call to function 'NativeDatabase.prepareAsync'
 * has been rejected» (NullPointerException) — justo lo que pasaba al buscar
 * en Creyentes. Ya estaba previsto («buscador con retardo») en
 * `docs/creyentes-movil-plan.md`, pero no llegó a escribirse.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(id);
    }, [value, delayMs]);

    return debounced;
}
