import { NOTE_KIND_ACCENTS, todayIn, type NoteDay, type NoteKind } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNoteDays } from '@/hooks/use-believers';
import { buildDateGrid, isInMonth } from '@/lib/ui/date-grid';
import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';

/**
 * La vista «calendario» de la bitácora (§7.5): los doce meses del año en
 * tarjetas, la cuadrícula de cada uno en miniatura, con **un cuadradito por
 * día**. Los días sin conversación van apenas insinuados — el vacío es lo
 * que la vista enseña, y sin cuadro la retícula no se ve — y los hablados
 * se pintan del color de su tipo, más cargado cuanto más notas ese día.
 */
export function NotesCalendarView({ believerId }: { believerId: string }) {
  const { t } = useTranslation();
  const [year, setYear] = useState(() => Number(todayIn('UTC').slice(0, 4)));
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const { data, isPending } = useNoteDays(believerId, from, to);
  const byDay = useMemo(() => new Map((data ?? []).map((day) => [day.date, day])), [data]);
  const months = useMemo(
    () =>
      Array.from(
        { length: 12 },
        (_unused, index) => `${year}-${String(index + 1).padStart(2, '0')}-01`,
      ),
    [year],
  );

  return (
    <View className="gap-3">
      <View className="gap-2 flex-row items-center justify-center">
        <IconButton
          icon="chevron-back"
          accessibilityLabel={t('notes.previousYear')}
          size="sm"
          onPress={() => setYear(year - 1)}
        />
        <Text className="text-base font-sans-semibold text-foreground tabular-nums">{year}</Text>
        <IconButton
          icon="chevron-forward"
          accessibilityLabel={t('notes.nextYear')}
          size="sm"
          onPress={() => setYear(year + 1)}
        />
      </View>

      {isPending ? (
        <View className="gap-2 flex-row flex-wrap">
          {months.slice(0, 6).map((month) => (
            <View key={month} className="rounded-xl" style={{ width: '31%' }}>
              <Skeleton className="h-24 rounded-xl" />
            </View>
          ))}
        </View>
      ) : (
        <View className="gap-2 flex-row flex-wrap justify-between">
          {months.map((month) => (
            <MiniMonth key={month} month={month} byDay={byDay} />
          ))}
        </View>
      )}

      <KindLegend />
    </View>
  );
}

function MiniMonth({ month, byDay }: { month: string; byDay: Map<string, NoteDay> }) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const vacio = hexAlpha(palette.mutedForeground, 0.15);
  const grid = buildDateGrid(month);
  const label = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' }).format(
    new Date(`${month}T00:00:00Z`),
  );

  return (
    <View className="gap-1 p-2 rounded-xl border border-border bg-card" style={{ width: '31%' }}>
      <Text className="font-sans-medium text-[10px] text-muted-foreground uppercase">{label}</Text>
      <View className="gap-0.5">
        {grid.weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row">
            {week.map((day) => {
              const entry = isInMonth(day, month) ? byDay.get(day) : undefined;
              return (
                <View
                  key={day}
                  className="aspect-square flex-1 items-center justify-center"
                  accessibilityLabel={
                    entry ? t('notes.calendarDay', { date: day, total: entry.total }) : undefined
                  }
                >
                  <View
                    className="h-3.5 w-3.5 rounded-[3px]"
                    style={{
                      backgroundColor: entry
                        ? hexAlpha(
                            NOTE_KIND_ACCENTS[entry.kinds[0] ?? 'seguimiento'],
                            entry.total > 2 ? 1 : entry.total === 2 ? 0.7 : 0.45,
                          )
                        : vacio,
                    }}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function KindLegend() {
  const { t } = useTranslation();
  const kinds = Object.keys(NOTE_KIND_ACCENTS) as NoteKind[];
  return (
    <View className="gap-1.5 flex-row flex-wrap items-center">
      {kinds.map((kind) => (
        <View key={kind} className="gap-1 flex-row items-center">
          <View
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: NOTE_KIND_ACCENTS[kind] }}
          />
          <Text className="text-[10px] text-muted-foreground">{t(`notes.kinds.${kind}`)}</Text>
        </View>
      ))}
    </View>
  );
}
