import { ENTRY_KINDS, type JournalStats, type JournalQuery } from '@navis/shared';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/ui/stat-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { JournalKindChip } from './journal-kind-chip';
import { JournalMonthlyChart } from './journal-monthly-chart';
import { useJournalTheme } from './journal-theme';
import { formatNumber } from '@/lib/format';

export function JournalOverview({
    stats,
    onOpen,
}: {
    stats: JournalStats;
    onOpen: (query: JournalQuery) => void;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme(),
        { fontScale } = useWindowDimensions();
    const month = stats.monthly.at(-1)?.month;
    return (
        <View style={{ gap: 24 }}>
            <View
                style={{
                    gap: 10,
                    flexDirection: fontScale > 1.2 ? 'column' : 'row',
                    flexWrap: 'wrap',
                }}
            >
                {[
                    { label: t('journal.stats.total'), value: stats.total, query: {} },
                    {
                        label: t('journal.stats.thisMonth'),
                        value: stats.thisMonth,
                        query: { from: month ? `${month}-01` : undefined },
                    },
                ].map((item) => (
                    <Pressable
                        key={item.label}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.label}: ${formatNumber(item.value)}`}
                        onPress={() => onOpen(item.query)}
                        style={{
                            flex: fontScale > 1.2 ? undefined : 1,
                            width: fontScale > 1.2 ? '100%' : undefined,
                            alignSelf: 'stretch',
                        }}
                    >
                        <StatCard label={item.label} value={formatNumber(item.value)} />
                    </Pressable>
                ))}
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('journal.stats.pendingReminders')}
                onPress={() => onOpen({ pendingReminder: true })}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    padding: 15,
                    backgroundColor: p.surface,
                    borderRadius: 26,
                }}
            >
                <ProgressRing
                    size={60}
                    strokeWidth={5}
                    progress={stats.total ? stats.pendingReminders / stats.total : 0}
                    label={formatNumber(stats.pendingReminders)}
                />
                <Text className="font-sans-medium" style={{ color: p.ink, flex: 1, fontSize: 14 }}>
                    {t('journal.stats.pendingReminders')}
                </Text>
            </Pressable>
            <View style={{ gap: 12 }}>
                <Text
                    accessibilityRole="header"
                    className="font-sans-semibold"
                    style={{ color: p.ink, fontSize: 18 }}
                >
                    {t('journal.stats.byKind')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {ENTRY_KINDS.map((kind) => (
                        <View
                            key={kind}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                            <JournalKindChip kind={kind} onPress={() => onOpen({ kind: [kind] })} />
                            <Text style={{ color: p.secondaryInk, fontSize: 13 }}>
                                {formatNumber(stats.byKind[kind])}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
            <JournalMonthlyChart stats={stats} />
        </View>
    );
}
