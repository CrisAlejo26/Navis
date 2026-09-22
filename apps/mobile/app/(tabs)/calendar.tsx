import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgendaList } from '@/components/calendar/agenda-list';
import { CalendarMonth } from '@/components/calendar/calendar-month';
import { DaySheet } from '@/components/calendar/day-sheet';
import { MeetingFormSheet } from '@/components/calendar/meeting-form-sheet';
import { PreacherPickerSheet, type PickTarget } from '@/components/calendar/preacher-picker-sheet';
import { ShareSheet } from '@/components/calendar/poster/share-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { useActiveCalendarStore } from '@/lib/calendar/active-calendar';
import { holidaysOfYear } from '@/lib/calendar/holidays';
import { useStatusBarClaim } from '@/lib/status-bar';
import { useThemeStore } from '@/lib/theme';
import {
  useAssignSlot,
  useCalendars,
  useCalendarSchedule,
  useCongregations,
} from '@/hooks/use-calendar';
import { findChurch } from '@/data/repos/church-repo';
import { useLocalSession } from '@/stores/local-session';
import { router } from 'expo-router';
import { addMonths, monthGrid, startOfMonth, todayIn } from '@navis/shared';

/** La zona horaria del dispositivo: en local, es la de quien usa la app. */
function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
  } catch {
    return 'Europe/Madrid';
  }
}

/** «septiembre de 2026», en el idioma activo (UTC: día de calendario). */
function tituloDeMes(ancla: string): string {
  return new Intl.DateTimeFormat('es', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${ancla}T00:00:00Z`));
}

/**
 * El calendario de programaciones en móvil (RFC 0002, pasos 4-5 del plan):
 * el mes como vista principal y la agenda para sentarse a repasar. Programar
 * no es un botón de la cabecera: se programa tocando la fase, que es donde
 * está la decisión.
 */
export default function CalendarScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  useStatusBarClaim(resolvedTheme === 'dark' ? 'light' : 'dark');

  const session = useLocalSession((state) => state.session);
  const { data: church } = useQuery({
    queryKey: ['church', session?.churchId],
    queryFn: () => findChurch(session!.churchId!),
    enabled: Boolean(session?.churchId),
  });

  const { data: calendars = [] } = useCalendars();
  const { data: congregations = [] } = useCongregations();
  const {
    calendarId: guardado,
    anchor: anclaGuardada,
    setCalendar,
    setAnchor,
  } = useActiveCalendarStore();

  const activo = calendars.find((one) => one.id === guardado) ?? calendars[0];
  const hoy = todayIn(deviceTimezone());
  // El ancla es **hoy**, no el día 1 del mes: la rejilla y `addMonths` ya lo
  // normalizan solos (`buildDateGrid`, `dates.ts`), y la web guarda el mismo
  // día exacto (`todayIso()` en `params.ts`). Normalizarlo aquí de más era lo
  // que dejaba «esta semana» de la lámina siempre en la semana del día 1 del
  // mes, no en la de hoy.
  const [ancla, setAnclaBase] = useState(() => anclaGuardada || hoy);
  const tramo = useMemo(() => monthGrid(ancla), [ancla]);

  function setAncla(ancla: string) {
    setAnclaBase(ancla);
    setAnchor(ancla);
  }

  const {
    data: schedule,
    isPending,
    isError,
    refetch,
  } = useCalendarSchedule(activo?.id ?? '', tramo.from, tramo.to);

  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [sedesFiltro, setSedesFiltro] = useState<readonly string[]>([]);
  const [festivos, setFestivos] = useState<Map<string, { name: string; scope: string }>>(new Map());

  const [openDay, setOpenDay] = useState<string | null>(null);
  const [target, setTarget] = useState<PickTarget | null>(null);
  const [addMeetingFor, setAddMeetingFor] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const asignar = useAssignSlot(activo?.id ?? '');

  // Los festivos: al cambiar de mes se mira si el año ya está en memoria (D4).
  useEffect(() => {
    void holidaysOfYear(Number(ancla.slice(0, 4)), 'ES', null).then((porDia) => {
      const simple = new Map<string, { name: string; scope: string }>();
      for (const [date, holiday] of porDia) simple.set(date, holiday);
      setFestivos(simple);
    });
  }, [ancla]);

  const diasFiltrados = useMemo(
    () =>
      (schedule?.days ?? []).map((day) => ({
        ...day,
        meetings: day.meetings.filter(
          (meeting) => sedesFiltro.length === 0 || sedesFiltro.includes(meeting.congregationId),
        ),
      })),
    [schedule?.days, sedesFiltro],
  );

  const multipleSedes = congregations.filter((one) => one.isActive).length > 1;
  const churchName = church?.name ?? t('common.appName');

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <View className="gap-3 px-4 pb-2">
        <TopBar
          title={activo?.name ?? t('calendar.title')}
          subtitle={t('calendar.subtitle')}
          subtitleClassName="text-xs"
          subtitleLines={1}
          actions={
            activo
              ? [
                  {
                    icon: 'stats-chart-outline',
                    label: t('calendar.balance'),
                    onPress: () => router.push('/calendar/balance'),
                  },
                  {
                    icon: 'share-outline',
                    label: t('calendar.share'),
                    onPress: () => setShareOpen(true),
                  },
                  {
                    icon: 'settings-outline',
                    label: t('calendar.settings'),
                    onPress: () => router.push('/calendar/settings'),
                  },
                ]
              : []
          }
        />

        {/*
         * Los calendarios van en una **fila que se desplaza de lado**: con
         * muchos (púlpito, recepción, sonido…), el `flex-wrap` apilaba filas
         * y se comía la cabecera; en un `ScrollView` horizontal siempre está
         * el elegido a un deslizamiento, sin indicator.
         */}
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
                selected={activo?.id === one.id}
                onPress={() => setCalendar(one.id)}
              />
            ))}
          </ScrollView>
        ) : null}

        {/* El título es lo flexible (`min-w-0`): un hijo ancho en un
            `flex-row` no encoge, y «Hoy» se salía de la pantalla cuando el
            mes se escribía largo («septiembre de 2026»). Los tres carriles
            van fijos de lado; el texto se trunca, nunca se va. */}
        <View className="gap-1 flex-row items-center">
          <IconButton
            icon="chevron-back"
            accessibilityLabel={t('common.previous')}
            onPress={() => setAncla(addMonths(ancla, -1))}
          />
          <Text
            numberOfLines={1}
            className="min-w-0 text-lg font-sans-semibold flex-1 text-center text-foreground"
          >
            {tituloDeMes(ancla)}
          </Text>
          <IconButton
            icon="chevron-forward"
            accessibilityLabel={t('common.next')}
            onPress={() => setAncla(addMonths(ancla, 1))}
          />
        </View>

        <View className="gap-2 flex-row items-center">
          <View className="flex-1">
            <SegmentedControl
              options={[
                { value: 'month', label: t('calendar.viewMonth') },
                { value: 'agenda', label: t('calendar.viewAgenda') },
              ]}
              value={view}
              onChange={setView}
            />
          </View>
          {startOfMonth(ancla) !== startOfMonth(hoy) ? (
            <Button size="sm" title={t('calendar.today')} onPress={() => setAncla(hoy)} />
          ) : null}
        </View>

        {/* El filtro de sedes, igual: fila horizontal, nunca en varias líneas. */}
        {multipleSedes ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5"
          >
            <Chip
              label={t('calendar.allCongregations')}
              selected={sedesFiltro.length === 0}
              onPress={() => setSedesFiltro([])}
            />
            {congregations
              .filter((one) => one.isActive)
              .map((one) => (
                <Chip
                  key={one.id}
                  label={one.name}
                  selected={sedesFiltro.includes(one.id)}
                  onPress={() =>
                    setSedesFiltro((prev) =>
                      prev.includes(one.id)
                        ? prev.filter((id) => id !== one.id)
                        : [...prev, one.id],
                    )
                  }
                />
              ))}
          </ScrollView>
        ) : null}
      </View>

      {/*
       * El mes **no va en scroll**: la rejilla reparte el alto que hay entre
       * las semanas — el máximo es el que manda el teléfono, con un `rem` de
       * aire antes de la barra inferior (pb-4). La agenda sí se desplaza:
       * es una lista, y encerrarla en un alto fijo la cortaría.
       */}
      {isPending ? (
        <View className="gap-2 px-4 flex-1">
          {[0, 1, 2].map((index) => (
            <View key={index} className="h-20 rounded-xl bg-muted" />
          ))}
        </View>
      ) : null}

      {isError ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-3 px-4 pb-10">
          <EmptyState
            icon="cloud-offline-outline"
            title={t('calendar.saveFailed')}
            action={{ label: t('common.retry'), onPress: () => void refetch() }}
          />
        </ScrollView>
      ) : null}

      {!isPending && !isError && activo ? (
        view === 'month' ? (
          <View className="min-h-0 px-4 pb-4 flex-1">
            <CalendarMonth
              month={ancla}
              today={hoy}
              meetingsOf={(date) => diasFiltrados.find((one) => one.date === date)?.meetings ?? []}
              holidayOf={(date) => festivos.get(date)?.name ?? null}
              onOpenDay={setOpenDay}
            />
          </View>
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="gap-3 px-4 pb-10">
            <AgendaList
              range={{ ...schedule, days: diasFiltrados }}
              today={hoy}
              onOpenDay={setOpenDay}
            />
          </ScrollView>
        )
      ) : null}

      <DaySheet
        date={openDay}
        range={schedule}
        canManage={Boolean(activo)}
        onClose={() => setOpenDay(null)}
        onPick={(slot, meeting, date) => {
          setTarget({
            date,
            // Propuesta del patrón: va el patternId; ya materializada: la reunión.
            meetingId: slot.id ? (meeting.id ?? undefined) : undefined,
            patternId: slot.id ? undefined : (meeting.patternId ?? undefined),
            position: slot.position,
          });
        }}
        onAddMeeting={setAddMeetingFor}
      />

      <PreacherPickerSheet
        calendarId={activo?.id ?? ''}
        target={target}
        onClose={() => setTarget(null)}
        onPick={(person) => {
          if (!target) return;
          asignar.mutate({
            date: target.date,
            meetingId: target.meetingId,
            patternId: target.patternId,
            position: target.position,
            believerId: person?.id ?? null,
          });
        }}
      />

      <MeetingFormSheet
        date={addMeetingFor}
        calendarId={activo?.id ?? ''}
        congregations={congregations}
        onClose={() => setAddMeetingFor(null)}
      />

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        anchor={ancla}
        selectedDate={openDay}
        calendarId={activo?.id ?? ''}
        calendarName={activo?.name ?? t('calendar.title')}
        churchName={churchName}
        congregations={congregations}
      />
    </View>
  );
}
