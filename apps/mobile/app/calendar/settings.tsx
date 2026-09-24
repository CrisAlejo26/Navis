import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { CongregationFormSheet } from '@/components/calendar/congregation-form-sheet';
import { PatternFormSheet } from '@/components/calendar/pattern-form-sheet';
import { AppBar } from '@/components/ui/app-bar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { TextField } from '@/components/ui/text-field';
import {
    useCalendars,
    useCongregations,
    useCreateCalendar,
    useDeleteCalendar,
    usePatterns,
    useUpdateCalendar,
} from '@/hooks/use-calendar';
import type { LocalPattern } from '@/data/repos/calendar-settings';
import type { LocalCongregation } from '@/data/repos/calendar-repo';
import { useCalendarTemplates } from '@/lib/calendar/templates';
import { useActiveCalendarStore } from '@/lib/calendar/active-calendar';

/**
 * Lo que hay detrás de **un** calendario (RFC 0002 §8.2, paso 7 del plan
 * móvil): sus reuniones fijas y las sedes de la iglesia. Se configura una vez
 * y el mes se llena solo a partir de ahí; por eso no está en la pantalla
 * principal, donde estorbaría todos los días.
 *
 * El calendario que se edita es el **activo** (el mismo estado que usa la
 * pantalla principal y el reparto, `useActiveCalendarStore`), no siempre el
 * primero: sin esto, el engranaje de Recepción, Sonido o Biblias —o el que se
 * acaba de crear con una plantilla— abría siempre los ajustes de Púlpito.
 */
export default function CalendarSettingsScreen() {
    const { t } = useTranslation();

    const { data: calendars = [] } = useCalendars();
    const { calendarId: guardado, setCalendar } = useActiveCalendarStore();
    const calendar = calendars.find((one) => one.id === guardado) ?? calendars[0];
    const { data: congregations = [] } = useCongregations();
    const { data: patterns = [] } = usePatterns(calendar?.id ?? '');

    const [patternOpen, setPatternOpen] = useState(false);
    const [pattern, setPattern] = useState<LocalPattern | null>(null);
    const [sede, setSede] = useState<LocalCongregation | null>(null);
    const [sedeNueva, setSedeNueva] = useState(false);
    const [calOpen, setCalOpen] = useState(false);
    const [calNueva, setCalNueva] = useState(false);
    const [nombre, setNombre] = useState('');
    const [nuevo, setNuevo] = useState('');
    const [plantilla, setPlantilla] = useState<string | null>(null);
    const crearCalendario = useCreateCalendar();
    const borrarCalendario = useDeleteCalendar();
    const renombrar = useUpdateCalendar();

    const plantillas = useCalendarTemplates(t);

    if (!calendar) {
        return <AppBar title={t('calendar.settings')} />;
    }

    return (
        <View className="flex-1 bg-background">
            <AppBar title={calendar.name} backLabel={t('common.back')} />

            <ScrollView contentContainerClassName="gap-4 px-4 pb-12 pt-3">
                {calendars.length > 1 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerClassName="gap-1.5"
                    >
                        {calendars.map((one) => (
                            <Chip
                                key={one.id}
                                label={one.name}
                                selected={calendar.id === one.id}
                                onPress={() => setCalendar(one.id)}
                            />
                        ))}
                    </ScrollView>
                ) : null}

                <View className="gap-2 flex-row">
                    <Button
                        variant="secondary"
                        size="sm"
                        title={t('calendar.addCalendar')}
                        onPress={() => {
                            setNombre('');
                            setPlantilla(null);
                            setCalNueva(true);
                        }}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        title={t('calendar.renameCalendar')}
                        onPress={() => {
                            setNombre(calendar.name);
                            setCalOpen(true);
                        }}
                    />
                    {calendars.length > 1 ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            title={t('common.delete')}
                            onPress={() => borrarCalendario.mutate(calendar.id)}
                        />
                    ) : null}
                </View>

                <Card title={t('calendar.patterns')}>
                    <View className="gap-2">
                        {patterns.length === 0 ? (
                            <EmptyState
                                icon="calendar-outline"
                                title={t('calendar.empty')}
                                description={t('calendar.emptyHint')}
                            />
                        ) : (
                            patterns.map((one) => (
                                <ListRow
                                    key={one.id}
                                    title={one.name}
                                    subtitle={`${NOMBRE_DE_DIA(one.weekday)} · ${one.startTime}`}
                                    onPress={() => {
                                        setPattern(one);
                                        setPatternOpen(true);
                                    }}
                                />
                            ))
                        )}
                        <Button
                            variant="secondary"
                            title={t('calendar.addPattern')}
                            leadingIcon="add"
                            onPress={() => {
                                setPattern(null);
                                setPatternOpen(true);
                            }}
                        />
                    </View>
                </Card>

                <Card title={t('calendar.congregations')}>
                    <View className="gap-2">
                        <View className="gap-1 flex-row flex-wrap">
                            {congregations.map((one) => (
                                <Chip
                                    key={one.id}
                                    label={one.name}
                                    selected
                                    onPress={() => setSede(one)}
                                />
                            ))}
                        </View>
                        <Button
                            variant="secondary"
                            title={t('calendar.addCongregation')}
                            leadingIcon="add"
                            onPress={() => {
                                setSede(null);
                                setSedeNueva(true);
                            }}
                        />
                    </View>
                </Card>
            </ScrollView>

            {patternOpen ? (
                <PatternFormSheet
                    calendarId={calendar.id}
                    congregations={congregations}
                    pattern={pattern ?? undefined}
                    onClose={() => setPatternOpen(false)}
                />
            ) : null}

            {sede ? (
                <CongregationFormSheet congregation={sede} onClose={() => setSede(null)} />
            ) : null}
            {sedeNueva ? <CongregationFormSheet onClose={() => setSedeNueva(false)} /> : null}

            {/* Renombrar **no cambia el slug**: cambia el nombre, que es lo que se lee. */}
            <BottomSheet
                visible={calOpen}
                onClose={() => setCalOpen(false)}
                title={t('calendar.renameCalendar')}
            >
                <View className="gap-3">
                    <TextField
                        label={t('calendar.calendarName')}
                        value={nombre}
                        onChangeText={setNombre}
                    />
                    <Button
                        title={t('common.save')}
                        loading={renombrar.isPending}
                        disabled={!nombre.trim()}
                        onPress={() => {
                            if (!nombre.trim()) return;
                            renombrar.mutate({ id: calendar.id, name: nombre });
                            setCalOpen(false);
                        }}
                    />
                </View>
            </BottomSheet>

            {/* Crear: elegir plantilla rellena nombre y labor, y la labor siembra ya
          la semana de esa labor en cada sede (§5.7). «En blanco» es válida. */}
            <BottomSheet
                visible={calNueva}
                onClose={() => setCalNueva(false)}
                title={t('calendar.addCalendar')}
            >
                <View className="gap-3">
                    <TextField
                        label={t('calendar.calendarName')}
                        value={nuevo}
                        onChangeText={setNuevo}
                    />
                    <View className="gap-1.5 flex-row flex-wrap">
                        {plantillas.map((one) => (
                            <Chip
                                key={one.slug ?? 'custom'}
                                label={one.name}
                                selected={plantilla === one.slug}
                                onPress={() => setPlantilla(one.slug)}
                            />
                        ))}
                    </View>
                    <Button
                        title={t('common.save')}
                        loading={crearCalendario.isPending}
                        disabled={!nuevo.trim()}
                        onPress={async () => {
                            if (!nuevo.trim()) return;
                            // Se cambia al recién creado: si no, quedaba sembrado y
                            // configurado pero sin forma de llegar a él desde aquí.
                            const creado = await crearCalendario.mutateAsync({
                                name: nuevo,
                                ministry: plantilla,
                            });
                            setCalendar(creado.id);
                            setNuevo('');
                            setCalNueva(false);
                        }}
                    />
                </View>
            </BottomSheet>
        </View>
    );
}

function NOMBRE_DE_DIA(weekday: number): string {
    return new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2024, 0, 7 + weekday)),
    );
}
