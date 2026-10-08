import { Text } from 'react-native';
import { entrySeconds, formatClock } from '@navis/shared';
import { useNow } from '@/hooks/use-now';

/** El reloj de un cronómetro en marcha, con cifras de ancho fijo para que no baile. */
export function RunningClock({ startedAt, className }: { startedAt: string; className?: string }) {
    const now = useNow(true);
    return (
        <Text
            className={className ?? 'font-sans-bold text-2xl text-foreground'}
            style={{ fontVariant: ['tabular-nums'] }}
        >
            {formatClock(entrySeconds({ startedAt, endedAt: null }, now))}
        </Text>
    );
}
