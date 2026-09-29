import type { DreamMonth, DreamWeekdayCount } from '@navis/shared';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BarChart } from '@/components/ui/bar-chart';
import { formatMonthShort, initialOf } from '@/lib/format';

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View className="gap-3 p-4 rounded-2xl border bg-card">
            <Text className="text-sm font-sans-medium text-foreground">{title}</Text>
            {children}
        </View>
    );
}

/** Los doce últimos meses: la línea de la tarjeta del mes en la web, aquí a ancho completo. */
export function DreamMonthlyChart({ monthly }: { monthly: readonly DreamMonth[] }) {
    const { t } = useTranslation();
    return (
        <Panel title={t('dreams.monthlyChart')}>
            <BarChart
                labelFontSize={9}
                data={monthly.map((one) => ({
                    value: one.count,
                    label: formatMonthShort(new Date(`${one.month}-01T00:00:00Z`)),
                }))}
            />
        </Panel>
    );
}

/**
 * En qué noches se sueña (`byWeekday`): 0 es el lunes, como en la franja. El
 * 5 de enero de 2026 es lunes, y de ahí sale la etiqueta de cada día en el
 * idioma activo.
 */
export function DreamWeekdayChart({ days }: { days: readonly DreamWeekdayCount[] }) {
    const { t } = useTranslation();
    return (
        <Panel title={t('dreams.weekdays')}>
            <BarChart
                data={days.map((one) => ({
                    value: one.count,
                    label: initialOf(new Date(Date.UTC(2026, 0, 5 + one.weekday)), 'weekday'),
                }))}
            />
        </Panel>
    );
}
