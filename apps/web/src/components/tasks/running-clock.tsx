import { entrySeconds, formatClock } from '@navis/shared';

import { useNow } from '@/lib/tasks/use-now';

/** El reloj de un cronómetro en marcha, en cifras de ancho fijo para que no baile. */
export function RunningClock({ startedAt, className }: { startedAt: string; className?: string }) {
    const now = useNow(true);
    return (
        <span className={className ?? 'tabular-nums'}>
            {formatClock(entrySeconds({ startedAt, endedAt: null }, now))}
        </span>
    );
}
