import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { SearchField } from '@/components/ui/search-field';
import { formatDay } from '@/lib/format';
import { usePreachers } from '@/hooks/use-calendar';
import type { Preacher } from '@navis/shared';

export interface PickTarget {
  date: string;
  /** Ya materializada: el id de la reunión; propuesta: el del patrón. */
  meetingId?: string;
  patternId?: string;
  position: number;
}

interface PreacherPickerSheetProps {
  calendarId: string;
  target: PickTarget | null;
  onClose: () => void;
  /** `null` es «quitar la asignación». */
  onPick: (person: Preacher | null) => void;
}

/**
 * El selector de personas (RFC 0002 §8.6): **todos los creyentes**, ordenados
 * por quien lleva más tiempo sin subir, con búsqueda y carga infinita — de
 * veinte en veinte al llegar al final del scroll, sin botón. Es la primitiva
 * del calendario: asignar en dos toques vive aquí.
 *
 * La búsqueda vive en el componente interior, que se **monta con la hoja**:
 * así su estado nace limpio en cada apertura y ningún efecto lo pisa.
 */
export function PreacherPickerSheet({
  calendarId,
  target,
  onClose,
  onPick,
}: PreacherPickerSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={Boolean(target)} onClose={onClose} title={t('calendar.searchPerson')}>
      {target ? (
        <Selector calendarId={calendarId} target={target} onClose={onClose} onPick={onPick} />
      ) : null}
    </BottomSheet>
  );
}

function Selector({
  calendarId,
  target,
  onClose,
  onPick,
}: {
  calendarId: string;
  target: PickTarget;
  onClose: () => void;
  onPick: (person: Preacher | null) => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');

  const { data, isFetching, fetchNextPage, hasNextPage } = usePreachers({
    calendarId,
    ministry: null,
    q: q.trim() || undefined,
    all: true,
    from: target.date,
    to: target.date,
  });
  const people = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View className="gap-3">
      <SearchField value={q} onChangeText={setQ} placeholder={t('calendar.searchPerson')} />

      <ScrollView
        style={{ maxHeight: 420 }}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={64}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          // A un telón de fondo del final: la siguiente tanda se pide sin
          // botón, como pide la carga infinita.
          const cerca = layoutMeasurement.height + contentOffset.y >= contentSize.height - 48;
          if (cerca && hasNextPage && !isFetching) void fetchNextPage();
        }}
      >
        {people.length === 0 ? (
          <Text className="py-6 text-sm text-center text-muted-foreground">
            {t('believers.noResults')}
          </Text>
        ) : null}
        {people.map((person) => (
          <PersonRow
            key={person.id}
            person={person}
            onPress={() => {
              onPick(person);
              onClose();
            }}
          />
        ))}
      </ScrollView>

      {isFetching ? (
        <View className="py-2 items-center">
          <ActivityIndicator size="small" />
        </View>
      ) : null}
    </View>
  );
}

function PersonRow({ person, onPress }: { person: Preacher; onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={person.name}
      onPress={onPress}
      className="gap-3 min-h-[56px] flex-row items-center active:opacity-70"
    >
      <Avatar name={person.name} size="sm" />
      <View className="gap-0.5 flex-1">
        <Text className="text-base font-sans-medium text-foreground">{person.name}</Text>
        <Text className="text-xs text-muted-foreground">
          {person.lastDate
            ? `${t('calendar.lastTime', { date: formatDay(person.lastDate) })} · ${t(
                'calendar.timesInRange',
                { count: person.timesInRange },
              )}`
            : `${t('calendar.never')} · ${t('calendar.timesInRange', { count: person.timesInRange })}`}
        </Text>
      </View>
    </Pressable>
  );
}
