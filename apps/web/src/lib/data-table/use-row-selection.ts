import { useCallback, useMemo, useState } from 'react';

export interface RowSelection<TItem> {
    count: number;
    /** Las filas marcadas, con el dato entero: una acción masiva no tiene que volver a pedirlas. */
    items: TItem[];
    has: (id: string) => boolean;
    toggle: (item: TItem) => void;
    /** Marca o desmarca varias a la vez (el «seleccionar todo» de la página). */
    setMany: (items: readonly TItem[], selected: boolean) => void;
    clear: () => void;
}

/**
 * Qué filas están marcadas, **entre páginas**: se guarda el dato y no solo el
 * identificador, porque en modo servidor la fila de la página 1 deja de estar
 * en memoria al pasar a la 2 y la acción masiva la necesita entera.
 *
 * Se vacía sola cuando cambia `resetKey` (los filtros y la búsqueda): una
 * acción sobre filas que ya no se ven en pantalla es una acción a ciegas.
 */
export function useRowSelection<TItem>(
    getKey: (item: TItem) => string,
    resetKey: string,
): RowSelection<TItem> {
    const [selected, setSelected] = useState<ReadonlyMap<string, TItem>>(new Map());
    const [seenKey, setSeenKey] = useState(resetKey);

    // Ajuste durante el render, que es lo que recomienda React para reaccionar a
    // un cambio de prop: un efecto pintaría un fotograma con la selección vieja.
    if (resetKey !== seenKey) {
        setSeenKey(resetKey);
        setSelected(new Map());
    }

    const toggle = useCallback(
        (item: TItem) => {
            setSelected((current) => {
                const next = new Map(current);
                const id = getKey(item);
                if (next.has(id)) next.delete(id);
                else next.set(id, item);
                return next;
            });
        },
        [getKey],
    );

    const setMany = useCallback(
        (items: readonly TItem[], on: boolean) => {
            setSelected((current) => {
                const next = new Map(current);
                for (const item of items) {
                    if (on) next.set(getKey(item), item);
                    else next.delete(getKey(item));
                }
                return next;
            });
        },
        [getKey],
    );

    const clear = useCallback(() => {
        setSelected(new Map());
    }, []);

    return useMemo(
        () => ({
            count: selected.size,
            items: [...selected.values()],
            has: (id: string) => selected.has(id),
            toggle,
            setMany,
            clear,
        }),
        [selected, toggle, setMany, clear],
    );
}
