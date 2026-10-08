import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { JournalStats } from '@navis/shared';
import { BarChart } from '@/components/ui/bar-chart';
import { IconButton } from '@/components/ui/icon-button';
import { formatMonthShort } from '@/lib/format';
import { useJournalTheme } from './journal-theme';

export function JournalMonthlyChart({ stats }: { stats: JournalStats }) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    const [older, setOlder] = useState(false),
        [selected, setSelected] = useState<string | null>(null);
    const months = older ? stats.monthly.slice(0, -6) : stats.monthly.slice(-6);
    const data = months.map((month) => ({
        value: month.total,
        label: formatMonthShort(new Date(`${month.month}-01T00:00:00Z`)),
    }));
    return (
        <View style={{ gap: 16, padding: 15, borderRadius: 26, backgroundColor: p.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text
                    accessibilityRole="header"
                    className="font-sans-semibold"
                    style={{ flex: 1, color: p.ink, fontSize: 17 }}
                >
                    {t('journal.stats.monthly')}
                </Text>
                <IconButton
                    icon="chevron-back"
                    size="lg"
                    accessibilityLabel={t('journal.mobile.olderMonths')}
                    disabled={older}
                    onPress={() => {
                        setOlder(true);
                        setSelected(null);
                    }}
                />
                <IconButton
                    icon="chevron-forward"
                    size="lg"
                    accessibilityLabel={t('journal.mobile.newerMonths')}
                    disabled={!older}
                    onPress={() => {
                        setOlder(false);
                        setSelected(null);
                    }}
                />
            </View>
            <Text accessibilityLiveRegion="polite" style={{ color: p.secondaryInk, fontSize: 13 }}>
                {selected ??
                    data
                        .filter((_, i) => i === 0 || i === data.length - 1)
                        .map((one) => one.label)
                        .join(' – ')}
            </Text>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <BarChart data={data} height={120} showValues />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {data.map((one, i) => (
                    <Pressable
                        key={months[i].month}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selected === `${one.label}: ${one.value}` }}
                        accessibilityLabel={`${one.label}: ${one.value}`}
                        onPress={() => setSelected(`${one.label}: ${one.value}`)}
                        style={{
                            minHeight: 44,
                            paddingHorizontal: 8,
                            justifyContent: 'center',
                            borderRadius: 12,
                            backgroundColor:
                                selected === `${one.label}: ${one.value}` ? p.card : undefined,
                        }}
                    >
                        <Text style={{ color: p.ink, fontSize: 12 }}>
                            {one.label} · {one.value}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}
