import { useEffect, useState } from 'react';

/**
 * El instante actual, refrescado cada segundo mientras `active`. Es lo que
 * hace avanzar el reloj de un cronómetro en marcha: la duración se calcula
 * de `startedAt` y de este valor, no se acumula en el estado.
 */
export function useNow(active: boolean): Date {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!active) return;
        const id = window.setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => {
            window.clearInterval(id);
        };
    }, [active]);

    return now;
}
