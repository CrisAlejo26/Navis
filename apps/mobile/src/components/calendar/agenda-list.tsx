import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';
import type { CalendarRange } from '@navis/shared';

interface AgendaListProps {
    range: CalendarRange;
    today: string;
    /** El día que se está mirando: los chips van hacia él y su bloque abre. */
    onOpenDay: (date: string) => void;
}

/**
 * La agenda vertical (RFC 0002 §8.5, y la decisión del plan): arriba la fila
 * de chips de fecha —cada uno con su contador de fases sin cubrir, el patrón
 * de Planny— y debajo los bloques por día, con la cinta completa de cada
 * reunión, al estilo de Mela. Solo los días con contenido: los demás no
 * ocupan sitio.
 */
export function AgendaList({ range, today, onOpenDay }: AgendaListProps) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<string | null>(null);

    const dias = useMemo(() => range.days.filter((day) => day.meetings.length > 0), [range.days]);
    const visible = useMemo(() => {
        if (selected)
            return range.days.filter((day) => day.date === selected && day.meetings.length > 0);
        return dias;
    }, [selected, dias, range.days]);

    if (dias.length === 0) {
        return (
            <EmptyState
                icon="calendar-outline"
                title={t('calendar.agendaEmpty')}
                description={t('calendar.noProgramme')}
            />
        );
    }

    return (
        <View className="gap-3">
            <View className="gap-1.5 flex-row">
                {dias.slice(0, 14).map((day) => {
                    const pendientes = day.meetings
                        .flatMap((meeting) => meeting.slots)
                        .filter((slot) => !slot.believer).length;
                    const activo = selected === day.date;

                    return (
                        <Pressable
                            key={day.date}
                            accessibilityRole="button"
                            accessibilityLabel={`${day.date}, ${pendientes} sin asignar`}
                            onPress={() => {
                                setSelected(activo ? null : day.date);
                                onOpenDay(day.date);
                            }}
                            className={cn(
                                'h-12 w-10 gap-0.5 min-w-[40px] items-center justify-center rounded-lg',
                                activo ? 'bg-brand' : 'bg-muted',
                                day.date === today && !activo && 'border border-brand',
                            )}
                        >
                            <Text
                                className={cn(
                                    'text-sm font-sans-medium',
                                    activo ? 'text-white' : 'text-foreground',
                                )}
                            >
                                {Number(day.date.slice(8, 10))}
                            </Text>
                            {pendientes > 0 ? (
                                <View
                                    className={cn(
                                        'h-1.5 w-1.5 rounded-full',
                                        activo ? 'bg-white' : 'bg-warning',
                                    )}
                                />
                            ) : (
                                <View className="h-1.5" />
                            )}
                        </Pressable>
                    );
                })}
            </View>

            {visible.map((day, index) => (
                <View key={day.date} className="gap-2">
                    <Text className="text-xs font-sans-medium text-muted-foreground">
                        {formatDay(day.date)}
                    </Text>
                    {day.meetings.map((meeting, meetingIndex) => (
                        <MeetingRibbon
                            key={`${meeting.name}-${meetingIndex}`}
                            meeting={meeting}
                            enterIndex={index * 2 + meetingIndex}
                            congregationName={
                                new Set(day.meetings.map((one) => one.congregationId)).size > 1
                                    ? range.congregations.find(
                                          (one) => one.id === meeting.congregationId,
                                      )?.name
                                    : undefined
                            }
                        />
                    ))}
                </View>
            ))}

            {visible.length === 0 ? (
                <Text className="text-sm text-muted-foreground">{t('calendar.noProgramme')}</Text>
            ) : null}
        </View>
    );
}
