import type { EntryKind } from '@navis/shared';
import { Text, View } from 'react-native';
import { useJournalTheme, kindColor } from './journal-theme';

export function JournalCalendarDay({
    day,
    selected,
    outside,
    today,
    kinds,
}: {
    day: string;
    selected: boolean;
    outside: boolean;
    today: string;
    kinds: readonly EntryKind[];
}) {
    const p = useJournalTheme();
    return (
        <View style={{ alignItems: 'center', gap: 4, opacity: outside ? 0.5 : 1 }}>
            <View
                style={{
                    minWidth: 32,
                    minHeight: 32,
                    padding: 4,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? p.primary : undefined,
                    borderWidth: day === today && !selected ? 1 : 0,
                    borderColor: p.primary,
                }}
            >
                <Text style={{ color: selected ? p.primaryForeground : p.ink, fontSize: 13 }}>
                    {Number(day.slice(8, 10))}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 3, minHeight: 5 }}>
                {kinds.slice(0, 3).map((kind) => (
                    <View
                        key={kind}
                        style={{
                            width: 5,
                            height: 5,
                            borderRadius: 3,
                            backgroundColor: kindColor(kind, p),
                        }}
                    />
                ))}
            </View>
        </View>
    );
}
