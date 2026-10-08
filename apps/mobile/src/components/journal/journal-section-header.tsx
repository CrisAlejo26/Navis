import { Text, View } from 'react-native';
import { useJournalTheme } from './journal-theme';

export function JournalSectionHeader({ title, count }: { title: string; count: number }) {
    const p = useJournalTheme();
    return (
        <View
            style={{
                flexDirection: 'row',
                gap: 12,
                paddingVertical: 16,
                backgroundColor: p.background,
            }}
        >
            <Text
                accessibilityRole="header"
                className="font-sans-semibold"
                style={{ flex: 1, color: p.ink, fontSize: 16 }}
            >
                {title}
            </Text>
            <Text style={{ color: p.secondaryInk, fontSize: 13 }}>{count}</Text>
        </View>
    );
}
