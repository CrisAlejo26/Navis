import { useEffect, useState } from 'react';

/**
 * El instante actual, refrescado cada segundo mientras `active`. Hace avanzar
 * el reloj de un cronómetro en marcha: la duración se calcula de `startedAt` y
 * de este valor, no se acumula en el estado, así que sobrevive a cerrar la app.
 */
export function useNow(active: boolean): Date {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, [active]);
    return now;
}
