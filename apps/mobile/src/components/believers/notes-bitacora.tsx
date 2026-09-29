import { NOTE_KINDS, type NoteKind } from '@navis/shared';

import type { LocalNote } from '@/data/repos/notes-repo';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, SectionList, Text, View } from 'react-native';

import { NoteFormSheet } from '@/components/believers/note-form-sheet';
import { toUpdateInput } from '@/components/believers/note-form-values';
import { NotesCalendarView } from '@/components/believers/notes-calendar-view';
import { NoteCard } from '@/components/believers/note-card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
    useAddAudio,
    useBelieverNotes,
    useCreateNote,
    useDeleteAudio,
    useDeleteNote,
    useNote,
    useNoteCounts,
    useUpdateNote,
} from '@/hooks/use-believers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useAfterReminderSaved } from '@/hooks/use-reminder-prompt';

type BitacoraView = 'log' | 'list' | 'calendar';

/**
 * La bitácora de un hermano (§7.5): buscador al servidor, pastillas de tipo
 * con su cuenta y tres vistas —la bitácora agrupada por mes, la lista para
 * escanear un año y el calendario que enseña los huecos—. «Ver más» carga de
 * veinte en veinte.
 */
export function NotesBitacora({
    believerId,
    believerName,
    openNoteId,
}: {
    believerId: string;
    believerName: string;
    /** La nota que abre el aviso de su recordatorio, si se llegó por él. */
    openNoteId?: string;
}) {
    const { t } = useTranslation();
    const [view, setView] = useState<BitacoraView>('log');
    const [search, setSearch] = useState('');
    const [kind, setKind] = useState<NoteKind | undefined>(undefined);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<LocalNote | null>(null);
    // La nota del aviso se abre sola, una vez: al cerrarla se anota como vista
    // (derivado, sin efecto que copie props a estado).
    const [dismissedNoteId, setDismissedNoteId] = useState<string | null>(null);
    const [pendingAudios, setPendingAudios] = useState<
        { uri: string; durationSeconds: number | null }[]
    >([]);

    // Sin retardo, cada pulsación relanza la consulta sobre SQLite y varias
    // llamadas nativas solapadas revientan `expo-sqlite` (ver `use-debounced-value`).
    const debouncedSearch = useDebouncedValue(search);
    const notes = useBelieverNotes(believerId, {
        search: debouncedSearch.trim() || undefined,
        kind,
    });
    const counts = useNoteCounts(believerId);
    const createNote = useCreateNote(believerId);
    const updateNote = useUpdateNote(believerId);
    const deleteNote = useDeleteNote(believerId);
    const addAudio = useAddAudio(believerId);
    const deleteAudio = useDeleteAudio(believerId);
    const afterReminderSaved = useAfterReminderSaved();
    const linked = useNote(openNoteId && openNoteId !== dismissedNoteId ? openNoteId : undefined);
    const sheetNote = editing ?? linked.data ?? null;

    const flat = notes.data?.pages.flatMap((page) => page.items) ?? [];
    const sections = groupByMonth(flat);

    return (
        <View className="gap-3">
            <Button
                title={t('notes.add')}
                onPress={() => {
                    setEditing(null);
                    setFormOpen(true);
                }}
            />

            <SearchField value={search} onChangeText={setSearch} placeholder={t('notes.search')} />
            <SegmentedControl
                value={view}
                onChange={setView}
                options={[
                    { value: 'log', label: t('notes.viewLog') },
                    { value: 'list', label: t('notes.viewList') },
                    { value: 'calendar', label: t('notes.viewCalendar') },
                ]}
            />

            <KindChips counts={counts.data} selected={kind} onSelect={setKind} />

            {notes.isPending ? (
                <Text className="text-sm text-muted-foreground">{t('common.loading')}</Text>
            ) : flat.length === 0 ? (
                <EmptyState
                    icon="book-outline"
                    title={
                        search || kind
                            ? t('notes.noResults')
                            : t('notes.empty', { name: believerName })
                    }
                    description={search || kind ? t('notes.noResultsHint') : t('notes.emptyHint')}
                    action={{
                        label: t('notes.add'),
                        onPress: () => {
                            setEditing(null);
                            setFormOpen(true);
                        },
                    }}
                />
            ) : view === 'calendar' ? (
                <NotesCalendarView believerId={believerId} />
            ) : view === 'list' ? (
                <FlatList
                    data={flat}
                    keyExtractor={(note) => note.id}
                    scrollEnabled={false}
                    contentContainerClassName="gap-3"
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => {
                                setEditing(item);
                                setFormOpen(true);
                            }}
                        >
                            <NoteCard
                                note={item}
                                onToggleReminder={(note, done) =>
                                    void updateNote.mutateAsync({
                                        id: note.id,
                                        input: { remindDone: done },
                                    })
                                }
                                onDeleteAudio={(audioId) => void deleteAudio.mutateAsync(audioId)}
                            />
                        </Pressable>
                    )}
                />
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(note) => note.id}
                    scrollEnabled={false}
                    contentContainerClassName="gap-2"
                    renderSectionHeader={({ section }) => (
                        <Text className="pt-2 pb-1 font-sans-semibold tracking-widest text-[11px] text-muted-foreground uppercase">
                            {section.title}
                        </Text>
                    )}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => {
                                setEditing(item);
                                setFormOpen(true);
                            }}
                        >
                            <NoteCard
                                note={item}
                                onToggleReminder={(note, done) =>
                                    void updateNote.mutateAsync({
                                        id: note.id,
                                        input: { remindDone: done },
                                    })
                                }
                                onDeleteAudio={(audioId) => void deleteAudio.mutateAsync(audioId)}
                            />
                        </Pressable>
                    )}
                />
            )}

            {notes.hasNextPage ? (
                <Button
                    title={t('notes.loadMore')}
                    variant="secondary"
                    size="sm"
                    loading={notes.isFetchingNextPage}
                    onPress={() => void notes.fetchNextPage()}
                />
            ) : null}

            <NoteFormSheet
                visible={formOpen || sheetNote !== null}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                    setPendingAudios([]);
                    if (openNoteId) setDismissedNoteId(openNoteId);
                }}
                note={sheetNote}
                pendingAudios={pendingAudios}
                onRecorded={(audio) => setPendingAudios((previous) => [...previous, audio])}
                onDelete={
                    sheetNote
                        ? () => {
                              void deleteNote.mutateAsync(sheetNote.id);
                              setFormOpen(false);
                          }
                        : undefined
                }
                onSave={async (input) => {
                    if (sheetNote) {
                        await updateNote.mutateAsync({
                            id: sheetNote.id,
                            input: toUpdateInput(input, sheetNote),
                        });
                        if (input.remindAt) await afterReminderSaved();
                        return;
                    }
                    const noteId = await createNote.mutateAsync(input);
                    for (const audio of pendingAudios) {
                        await addAudio.mutateAsync({
                            noteId,
                            audio: {
                                sourceUri: audio.uri,
                                mimeType: 'audio/mp4',
                                sizeBytes: 0,
                                durationSeconds: audio.durationSeconds,
                                recorded: true,
                            },
                        });
                    }
                    if (input.remindAt) await afterReminderSaved();
                }}
            />
        </View>
    );
}

function KindChips({
    counts,
    selected,
    onSelect,
}: {
    counts: Record<string, number> | undefined;
    selected: NoteKind | undefined;
    onSelect: (kind: NoteKind | undefined) => void;
}) {
    const { t } = useTranslation();
    // De lado, como los filtros del listado de creyentes: con siete tipos, el
    // ajuste de línea movía la fila entera cada vez que llegaba una nota nueva.
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
        >
            <Chip
                label={`${t('notes.all')} (${counts?.total ?? 0})`}
                selected={!selected}
                onPress={() => onSelect(undefined)}
            />
            {NOTE_KINDS.map((one) => (
                <Chip
                    key={one}
                    label={`${t(`notes.kinds.${one}`)} (${counts?.[one] ?? 0})`}
                    selected={selected === one}
                    tone={one === 'correccion' ? 'destructive' : 'primary'}
                    onPress={() => onSelect(selected === one ? undefined : one)}
                />
            ))}
        </ScrollView>
    );
}

function groupByMonth(notes: LocalNote[]): { title: string; data: LocalNote[] }[] {
    const byMonth = new Map<string, LocalNote[]>();
    for (const note of notes) {
        const key = note.occurredAt.slice(0, 7);
        const list = byMonth.get(key) ?? [];
        list.push(note);
        byMonth.set(key, list);
    }
    return [...byMonth].map(([key, data]) => ({ title: monthTitle(key), data }));
}

function monthTitle(key: string): string {
    return new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${key}-01T00:00:00Z`));
}
