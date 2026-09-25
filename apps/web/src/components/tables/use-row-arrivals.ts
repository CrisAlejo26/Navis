import { useEffect, useState } from 'react';

const ARRIVAL_WINDOW_MS = 2500;

/**
 * Qué filas acaban de llegar tras añadir creyentes, para animar su entrada
 * (RFC 0025 D16). `mark` guarda quiénes estaban antes; durante un par de
 * segundos, lo que no estaba cuenta como llegado. Pasado el plazo se apaga,
 * para que una recarga o un cambio de página no vuelvan a animar filas viejas.
 */
export function useRowArrivals(currentIds: readonly string[]): {
    mark: () => void;
    isNew: (id: string) => boolean;
} {
    const [before, setBefore] = useState<ReadonlySet<string> | null>(null);

    useEffect(() => {
        if (!before) return;
        const timer = setTimeout(() => {
            setBefore(null);
        }, ARRIVAL_WINDOW_MS);
        return () => {
            clearTimeout(timer);
        };
    }, [before]);

    return {
        mark: () => {
            setBefore(new Set(currentIds));
        },
        isNew: (id) => before !== null && !before.has(id),
    };
}
