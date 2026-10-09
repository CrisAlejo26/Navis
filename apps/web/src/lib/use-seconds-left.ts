import { useEffect, useState } from 'react';

/** Segundos que faltan para `target`, refrescados cada segundo; nunca baja de cero. */
export function useSecondsLeft(target: Date): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => {
            clearInterval(id);
        };
    }, []);

    return Math.max(0, Math.ceil((target.getTime() - now) / 1000));
}
