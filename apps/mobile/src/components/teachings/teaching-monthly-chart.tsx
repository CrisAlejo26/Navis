import type { TeachingMonth } from '@navis/shared';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BarChart } from '@/components/ui/bar-chart';
import { formatMonthShort } from '@/lib/format';

/** Enseñanzas mes a mes, los últimos doce (vacíos incluidos): sobre `BarChart` de `components/ui`. */
export function TeachingMonthlyChart({ monthly }: { monthly: readonly TeachingMonth[] }) {
    const { t } = useTranslation();

    return (
        <View className="gap-3 p-4 rounded-2xl border border-accent/40 bg-card">
            <Text className="text-sm font-sans-medium text-foreground">
                {t('teachings.stats.monthly')}
            </Text>
            <BarChart
                labelFontSize={9}
                data={monthly.map((one) => ({
                    value: one.total,
                    label: formatMonthShort(new Date(`${one.month}-01T00:00:00Z`)),
                }))}
            />
        </View>
    );
}
