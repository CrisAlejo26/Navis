import { ENTRY_KINDS, type JournalStats, type JournalQuery } from '@navis/shared';
import { useState } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { hexAlpha } from '@/lib/color';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { formatMonthShort } from '@/lib/format';
import { KIND_ICON, kindColor, useJournalPalette } from './journal-theme';

export function JournalOverview({
    stats,
    onOpen,
}: {
    stats: JournalStats;
    onOpen: (query: JournalQuery) => void;
}) {
    const { t } = useTranslation(),
        p = useJournalPalette();
    const summary = [
        {
            label: t('journal.stats.total'),
            value: stats.total,
            query: {},
            icon: 'documents-outline' as const,
        },
        {
            label: t('journal.stats.thisMonth'),
            value: stats.thisMonth,
            query: {
                from: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
                to: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`,
            },
            icon: 'calendar-outline' as const,
        },
    ];
    const [older, setOlder] = useState(false),
        [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const months = older ? stats.monthly.slice(0, -6) : stats.monthly.slice(-6);
    const max = Math.max(1, ...months.map((month) => month.total));
    return (
        <View style={{ gap: 24 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                {summary.map((item) => (
                    <Pressable
                        key={item.label}
                        accessibilityRole="button"
                        onPress={() => onOpen(item.query)}
                        style={({ pressed }) => ({
                            flex: 1,
                            backgroundColor: p.surface,
                            padding: 16,
                            borderRadius: 20,
                            gap: 6,
                            opacity: pressed ? 0.6 : 1,
                        })}
                    >
                        <Ionicons accessible={false} name={item.icon} size={22} color={p.link} />
                        <Text style={{ color: p.ink, fontSize: 26, fontWeight: '700' }}>
                            {item.value}
                        </Text>
                        <Text style={{ color: p.secondaryInk, fontSize: 13 }}>{item.label}</Text>
                    </Pressable>
                ))}
            </View>
            <Pressable
                accessibilityRole="button"
                onPress={() => onOpen({ pendingReminder: true })}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    borderRadius: 20,
                    backgroundColor: p.surface,
                    opacity: pressed ? 0.6 : 1,
                })}
            >
                <Ionicons accessible={false} name="alarm-outline" size={24} color={p.link} />
                <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: p.ink, fontSize: 16, fontWeight: '700' }}>
                        {stats.pendingReminders}
                    </Text>
                    <Text style={{ color: p.secondaryInk, fontSize: 13 }}>
                        {t('journal.stats.pendingReminders')}
                    </Text>
                </View>
                <Ionicons
                    accessible={false}
                    name="chevron-forward"
                    size={20}
                    color={p.secondaryInk}
                />
            </Pressable>
            <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 18, color: p.ink, fontWeight: '700' }}>
                    {t('journal.stats.byKind')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {ENTRY_KINDS.map((kind) => (
                        <Pressable
                            key={kind}
                            accessibilityRole="button"
                            onPress={() => onOpen({ kind: [kind] })}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                gap: 8,
                                alignItems: 'center',
                                borderRadius: 16,
                                minHeight: 48,
                                paddingHorizontal: 14,
                                backgroundColor: hexAlpha(kindColor(kind, p), 0.08),
                                opacity: pressed ? 0.6 : 1,
                            })}
                        >
                            <Ionicons
                                accessible={false}
                                name={KIND_ICON[kind]}
                                size={18}
                                color={kindColor(kind, p)}
                            />
                            <Text style={{ fontSize: 13, color: p.ink }}>
                                {t(`journal.kind.${kind}`)}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: kindColor(kind, p),
                                    fontWeight: '700',
                                }}
                            >
                                {stats.byKind[kind]}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
            <View style={{ gap: 16, backgroundColor: p.surface, padding: 16, borderRadius: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                        accessibilityRole="header"
                        style={{ flex: 1, color: p.ink, fontSize: 17, fontWeight: '700' }}
                    >
                        {t('journal.mobile.activity')}
                    </Text>
                    <IconButton
                        icon="chevron-back"
                        size="lg"
                        accessibilityLabel={t('journal.mobile.olderMonths')}
                        disabled={older}
                        onPress={() => {
                            setOlder(true);
                            setSelectedMonth(null);
                        }}
                    />
                    <IconButton
                        icon="chevron-forward"
                        size="lg"
                        accessibilityLabel={t('journal.mobile.newerMonths')}
                        disabled={!older}
                        onPress={() => {
                            setOlder(false);
                            setSelectedMonth(null);
                        }}
                    />
                </View>
                <Text
                    accessibilityLiveRegion="polite"
                    style={{ color: p.secondaryInk, fontSize: 13 }}
                >
                    {selectedMonth
                        ? `${formatMonthShort(new Date(`${selectedMonth}-01T00:00:00Z`))}: ${stats.monthly.find((m) => m.month === selectedMonth)?.total ?? 0}`
                        : months
                              .map((m) => formatMonthShort(new Date(`${m.month}-01T00:00:00Z`)))
                              .filter((_, i) => i === 0 || i === months.length - 1)
                              .join(' – ')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                    {months.map((month) => (
                        <Pressable
                            key={month.month}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedMonth === month.month }}
                            accessibilityLabel={`${formatMonthShort(new Date(`${month.month}-01T00:00:00Z`))}: ${month.total}`}
                            onPress={() => setSelectedMonth(month.month)}
                            style={({ pressed }) => ({
                                flex: 1,
                                alignItems: 'center',
                                gap: 8,
                                paddingTop: 8,
                                paddingBottom: 8,
                                opacity: pressed ? 0.6 : 1,
                            })}
                        >
                            <View style={{ height: 104, width: '70%', justifyContent: 'flex-end' }}>
                                <View
                                    style={{
                                        width: '100%',
                                        height: Math.max(4, (month.total / max) * 96),
                                        borderRadius: 6,
                                        backgroundColor: month.total ? p.primary : p.line,
                                        opacity:
                                            selectedMonth && selectedMonth !== month.month
                                                ? 0.4
                                                : 1,
                                    }}
                                />
                            </View>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: selectedMonth === month.month ? p.link : p.secondaryInk,
                                    fontWeight: selectedMonth === month.month ? '700' : '400',
                                }}
                            >
                                {formatMonthShort(new Date(`${month.month}-01T00:00:00Z`))}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
}
