import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ScrollView, Text, View } from 'react-native';

import type { CalendarWarningKind } from '@navis/shared';
import { monthGrid, startOfMonth, todayIn } from '@navis/shared';

import { AppBar } from '@/components/ui/app-bar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { useActiveCalendarStore } from '@/lib/calendar/active-calendar';
import { formatDay } from '@/lib/format';
import { useCalendars, useCalendarSchedule, useCalendarSummary } from '@/hooks/use-calendar';

/**
 * El panel de reparto (RFC 0002 §9.4, paso 8 del plan móvil): quién ha subido
 * cuántas veces, cuándo fue la última y en qué sedes, más los avisos del
 * tramo. Va como pantalla apilada, no como hoja: una lista con avisos quiere
 * altura completa.
 */
export default function CalendarBalanceScreen() {
    const { t } = useTranslation();
    const calendarId = useActiveCalendarStore((state) => state.calendarId);
    const { data: calendars = [] } = useCalendars();
    const activo = calendars.find((one) => one.id === calendarId) ?? calendars[0];
    const tramo = monthGrid(startOfMonth(todayIn(timezoneDelDispositivo())));

    const { data: summary } = useCalendarSummary(activo?.id ?? '', tramo.from, tramo.to);

    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('calendar.balance')} backLabel={t('common.back')} />

            <ScrollView contentContainerClassName="gap-4 px-4 pb-12 pt-3">
                <Card title={t('calendar.balance')}>
                    {(summary?.people ?? []).length === 0 ? (
                        <EmptyState
                            icon="people-outline"
                            title={t('calendar.balance')}
                            description={t('calendar.noProgramme')}
                        />
                    ) : (
                        <View className="gap-1">
                            {summary!.people.map((one) => (
                                <ListRow
                                    key={one.believerId}
                                    leading={<Avatar name={one.name} size="sm" />}
                                    title={one.name}
                                    subtitle={`${t('calendar.timesInRange', { count: one.times })} · ${
                                        one.lastDate
                                            ? t('calendar.lastTime', {
                                                  date: formatDay(one.lastDate),
                                              })
                                            : t('calendar.never')
                                    }`}
                                    trailing={<Badge label={String(one.times)} tone="primary" />}
                                />
                            ))}
                        </View>
                    )}
                </Card>

                <Card title={t('calendar.warnings')}>
                    {(summary?.warnings ?? []).length === 0 ? (
                        <Text className="text-sm text-muted-foreground">
                            {t('calendar.noWarnings')}
                        </Text>
                    ) : (
                        <View className="gap-2">
                            {summary!.warnings.map((one, index) => (
                                <Text key={index} className="text-sm text-foreground">
                                    {TITULO_AVISO(
                                        one.kind,
                                        one.detail,
                                        one.believerName ?? undefined,
                                        t,
                                    )}
                                </Text>
                            ))}
                        </View>
                    )}
                </Card>
            </ScrollView>
        </View>
    );
}

function timezoneDelDispositivo(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
    } catch {
        return 'Europe/Madrid';
    }
}

function TITULO_AVISO(
    kind: CalendarWarningKind,
    detail: string,
    name: string | undefined,
    t: TFunction,
): string {
    switch (kind) {
        case 'unassigned':
            return t('calendar.warnUnassigned', { detail });
        case 'twiceSameDay':
            return t('calendar.warnTwiceSameDay', { name });
        case 'backToBack':
            return t('calendar.warnBackToBack', { name });
        case 'twoVenues':
            return t('calendar.warnTwoVenues', { name });
    }
}
