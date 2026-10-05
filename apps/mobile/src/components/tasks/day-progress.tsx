import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ProgressRing } from '@/components/ui/progress-ring';
import { hexAlpha } from '@/lib/color';
import { useTaskPalette } from './task-theme';
export function DayProgress({
    day,
    total,
    done,
    selected,
    outside,
}: {
    day: string;
    total: number;
    done: number;
    selected: boolean;
    outside: boolean;
}) {
    const p = useTaskPalette(),
        complete = total > 0 && total === done;
    return (
        <View
            style={{
                width: 40,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: outside ? 0.35 : 1,
            }}
        >
            {selected && (
                <View
                    style={{
                        position: 'absolute',
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: p.primary,
                    }}
                />
            )}
            {total > 0 && !complete && (
                <View style={{ position: 'absolute' }}>
                    <ProgressRing
                        size={36}
                        strokeWidth={2.5}
                        progress={done / total}
                        progressColor={selected ? p.primaryForeground : undefined}
                        trackColor={selected ? hexAlpha(p.primaryForeground, 0.25) : undefined}
                    />
                </View>
            )}
            {complete && (
                <Svg width={42} height={44} viewBox="0 0 42 44" style={{ position: 'absolute' }}>
                    <Path
                        d="M17 17 L25 17 L28 40 L14 40 Z M16 12 L26 12 L26 18 L16 18 Z M15 12 L21 7 L27 12 Z"
                        fill={hexAlpha(p.warning, 0.18)}
                        stroke={p.warning}
                        strokeWidth={1.5}
                    />
                    <Path
                        d="M14 11 L3 5 L3 16 Z M28 11 L39 5 L39 16 Z"
                        fill={hexAlpha(p.warning, 0.23)}
                    />
                </Svg>
            )}
            <Text
                className="font-sans-semibold text-[13px]"
                style={{ color: selected ? p.primaryForeground : p.foreground }}
            >
                {Number(day.slice(8, 10))}
            </Text>
        </View>
    );
}
