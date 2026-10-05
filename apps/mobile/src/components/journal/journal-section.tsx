import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IoniconName } from '@/lib/nav-mobile';
import { useJournalPalette } from './journal-theme';

export function JournalSection({
    title,
    icon,
    open,
    onToggle,
    children,
    summary,
}: {
    title: string;
    icon: IoniconName;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
    summary?: string;
}) {
    const p = useJournalPalette();
    return (
        <View style={{ borderRadius: 20, backgroundColor: p.surface, overflow: 'hidden' }}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={title}
                onPress={onToggle}
                style={({ pressed }) => ({
                    minHeight: 56,
                    padding: 16,
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'center',
                    opacity: pressed ? 0.65 : 1,
                })}
            >
                <Ionicons accessible={false} name={icon} size={22} color={p.link} />
                <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: p.ink, fontSize: 15, fontWeight: '600' }}>{title}</Text>
                    {summary && (
                        <Text style={{ color: p.secondaryInk, fontSize: 12 }}>{summary}</Text>
                    )}
                </View>
                <Ionicons
                    accessible={false}
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={p.secondaryInk}
                />
            </Pressable>
            {open && <View style={{ padding: 16, paddingTop: 0, gap: 16 }}>{children}</View>}
        </View>
    );
}
