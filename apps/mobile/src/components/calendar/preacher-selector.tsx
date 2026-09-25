import { joinNames, type MeetingSlot, type Preacher } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { PreacherPersonRow } from '@/components/calendar/preacher-person-row';
import type { PickTarget } from '@/components/calendar/preacher-picker-sheet';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { usePreachers } from '@/hooks/use-calendar';
import { getLocale } from '@/lib/i18n';

type SlotPerson = MeetingSlot['believers'][number];

/** La búsqueda, la lista con carga infinita y lo marcado: el cuerpo de la hoja. */
export function PreacherSelector({
    calendarId,
    target,
    onSave,
}: {
    calendarId: string;
    target: PickTarget;
    onSave: (people: MeetingSlot['believers']) => void;
}) {
    const { t } = useTranslation();
    const [q, setQ] = useState('');
    const [chosen, setChosen] = useState<SlotPerson[]>(target.believers);

    const { data, isFetching, fetchNextPage, hasNextPage } = usePreachers({
        calendarId,
        ministry: null,
        q: q.trim() || undefined,
        all: true,
        from: target.date,
        to: target.date,
    });
    const people = data?.pages.flatMap((page) => page.items) ?? [];

    const toggle = (person: Preacher) => {
        setChosen((current) =>
            current.some((one) => one.id === person.id)
                ? current.filter((one) => one.id !== person.id)
                : [...current, { id: person.id, name: person.name }],
        );
    };

    return (
        <View className="gap-3">
            <Text className="text-xs text-muted-foreground">
                {chosen.length > 0
                    ? joinNames(
                          chosen.map((one) => one.name),
                          getLocale(),
                      )
                    : t('calendar.pickHint')}
            </Text>

            <SearchField value={q} onChangeText={setQ} placeholder={t('calendar.searchPerson')} />

            <ScrollView
                style={{ maxHeight: 360 }}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={64}
                onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    // A un telón de fondo del final: la siguiente tanda se pide sin
                    // botón, como pide la carga infinita.
                    const cerca =
                        layoutMeasurement.height + contentOffset.y >= contentSize.height - 48;
                    if (cerca && hasNextPage && !isFetching) void fetchNextPage();
                }}
            >
                {people.length === 0 ? (
                    <Text className="py-6 text-sm text-center text-muted-foreground">
                        {t('believers.noResults')}
                    </Text>
                ) : null}
                {people.map((person) => (
                    <PreacherPersonRow
                        key={person.id}
                        person={person}
                        selected={chosen.some((one) => one.id === person.id)}
                        onPress={() => {
                            toggle(person);
                        }}
                    />
                ))}
            </ScrollView>

            {isFetching ? (
                <View className="py-2 items-center">
                    <ActivityIndicator size="small" />
                </View>
            ) : null}

            <View className="gap-2 flex-row items-center justify-between">
                <Button
                    title={t('calendar.clearSlot')}
                    variant="ghost"
                    onPress={() => {
                        onSave([]);
                    }}
                />
                <Button
                    title={t('common.save')}
                    size="lg"
                    onPress={() => {
                        onSave(chosen);
                    }}
                />
            </View>
        </View>
    );
}
