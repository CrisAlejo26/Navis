import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useCreatePattern, useDeletePattern, useUpdatePattern } from '@/hooks/use-calendar';
import type { LocalPattern } from '@/data/repos/calendar-settings';
import { WEEKDAYS } from '@navis/shared';

interface PatternFormSheetProps {
    calendarId: string;
    congregations: readonly { id: string; name: string; accent: string; isActive: boolean }[];
    /** La reunión fija a editar; `undefined` es crear. */
    pattern?: LocalPattern;
    onClose: () => void;
}

const HORAS = ['09:00', '10:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '21:00'];

const NOMBRES_DE_DIA = WEEKDAYS.map((weekday) =>
    new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2024, 0, 7 + weekday)), // 2024-01-07 es domingo
    ),
);

/**
 * Crear o editar una **reunión fija** (RFC 0002 §5.3): sede, día de la
 * semana, hora y sus fases en su orden — el punto de partida del mes entero.
 *
 * El cuerpo se monta **con `key`**: tocar una fila de la lista para editar
 * otro patrón mientras la hoja ya está abierta cambia `pattern` sin
 * desmontar el componente, y un `useEffect` para copiarlo pisaba lo que se
 * estaba escribiendo tras el primer render (la misma solución que
 * `BelieverFormSheet`).
 */
export function PatternFormSheet(props: PatternFormSheetProps) {
    return <PatternFormBody key={props.pattern?.id ?? 'new'} {...props} />;
}

function PatternFormBody({ calendarId, congregations, pattern, onClose }: PatternFormSheetProps) {
    const { t } = useTranslation();
    const [sedeId, setSedeId] = useState<string | null>(pattern?.congregationId ?? null);
    const [name, setName] = useState(pattern?.name ?? 'Culto');
    const [weekday, setWeekday] = useState(pattern ? String(pattern.weekday) : '5');
    const [startTime, setStartTime] = useState(pattern?.startTime.slice(0, 5) ?? '19:00');
    const [phases, setPhases] = useState<readonly string[]>(
        pattern ? pattern.phases.map((phase) => phase.name) : ['Introducción', 'Final'],
    );
    const [nuevaFase, setNuevaFase] = useState('');
    const crear = useCreatePattern(calendarId);
    const actualizar = useUpdatePattern(calendarId);
    const borrar = useDeletePattern();

    function guardar() {
        const sede = sedeId ?? (congregations.length === 1 ? congregations[0]?.id : null);
        if (!sede || !name.trim() || phases.length === 0) return;

        const phasesInput = phases.map((fase) => ({ name: fase }));
        if (pattern) {
            actualizar.mutate({
                id: pattern.id,
                name,
                weekday: Number(weekday),
                startTime,
                accent: pattern.accent,
                isActive: pattern.isActive,
                phases: phasesInput,
            });
        } else {
            crear.mutate({
                congregationId: sede,
                name,
                weekday: Number(weekday),
                startTime,
                phases: phasesInput,
            });
        }
        onClose();
    }

    return (
        <BottomSheet
            visible={Boolean(pattern !== null && pattern !== undefined) || pattern === undefined}
            onClose={onClose}
            title={pattern ? t('calendar.patterns') : t('calendar.addPattern')}
        >
            <View className="gap-3">
                {congregations.length > 1 ? (
                    <Select
                        label={t('calendar.congregation')}
                        placeholder={t('calendar.congregation')}
                        value={pattern?.congregationId ?? sedeId}
                        options={congregations
                            .filter((one) => one.isActive)
                            .map((one) => ({ value: one.id, label: one.name }))}
                        onChange={setSedeId}
                    />
                ) : null}

                <TextField label={t('calendar.meetingName')} value={name} onChangeText={setName} />

                <View className="gap-2 flex-row">
                    <View className="flex-1">
                        <Select
                            label={t('calendar.patternWeekday')}
                            placeholder={t('calendar.patternWeekday')}
                            value={weekday}
                            options={WEEKDAYS.map((one, index) => ({
                                value: String(one),
                                label: NOMBRES_DE_DIA[index],
                            }))}
                            onChange={setWeekday}
                        />
                    </View>
                    <View className="w-32">
                        <Select
                            label={t('calendar.startTime')}
                            placeholder={t('calendar.startTime')}
                            value={startTime}
                            options={HORAS.map((hora) => ({ value: hora, label: hora }))}
                            onChange={setStartTime}
                        />
                    </View>
                </View>

                <View className="gap-1">
                    <Text className="text-sm font-sans-medium text-foreground">
                        {t('calendar.phases')}
                    </Text>
                    {phases.map((fase, index) => (
                        <View key={`${fase}-${index}`} className="gap-2 flex-row items-center">
                            <Text className="text-sm flex-1 text-foreground">{fase}</Text>
                            <Pressable
                                accessibilityLabel={`${t('common.delete')}: ${fase}`}
                                onPress={() =>
                                    setPhases((prev) => prev.filter((_one, i) => i !== index))
                                }
                                className="h-11 w-11 items-center justify-center"
                            >
                                <Icon name="close-circle" size="sm" className="text-destructive" />
                            </Pressable>
                        </View>
                    ))}
                    <View className="gap-2 flex-row">
                        <View className="flex-1">
                            <TextField
                                label={t('calendar.addPhase')}
                                value={nuevaFase}
                                onChangeText={setNuevaFase}
                                onSubmitEditing={añadirFase}
                            />
                        </View>
                        <View className="pb-1 justify-end">
                            <Button leadingIcon="add" title="" onPress={añadirFase} />
                        </View>
                    </View>
                </View>

                {pattern ? (
                    <Button
                        variant="ghost"
                        title={t('common.delete')}
                        onPress={() => {
                            borrar.mutate(pattern.id);
                            onClose();
                        }}
                    />
                ) : null}

                <Button
                    title={t('common.save')}
                    onPress={guardar}
                    loading={crear.isPending || actualizar.isPending}
                    disabled={congregations.length > 1 && !sedeId}
                />
            </View>
        </BottomSheet>
    );

    function añadirFase() {
        if (!nuevaFase.trim()) return;
        setPhases((prev) => [...prev, nuevaFase.trim()]);
        setNuevaFase('');
    }
}
