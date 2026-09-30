import { believerName } from '@navis/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';

import { NoteActions } from '@/components/believers/note-actions';
import { NoteFormSheet } from '@/components/believers/note-form-sheet';
import { toUpdateInput } from '@/components/believers/note-form-values';
import { NoteHero } from '@/components/believers/note-hero';
import { NoteInfo } from '@/components/believers/note-info';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useBeliever,
    useDeleteAudio,
    useDeleteNote,
    useNote,
    useUpdateNote,
} from '@/hooks/use-believers';
import { useAfterReminderSaved } from '@/hooks/use-reminder-prompt';
import { useStatusBarClaim } from '@/lib/status-bar';

/**
 * El detalle de una nota, en su propia página —no en una hoja—: se llega desde
 * la bitácora o desde el aviso de su recordatorio, y aquí se **lee**; editar
 * es el botón de la fila de acciones, nunca lo que pasa por entrar.
 */
export default function NoteDetailScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: note, isPending, isError, refetch } = useNote(id);
    const believer = useBeliever(note?.believerId ?? '');
    const believerId = note?.believerId ?? '';
    const updateNote = useUpdateNote(believerId);
    const deleteNote = useDeleteNote(believerId);
    const deleteAudio = useDeleteAudio(believerId);
    const afterReminderSaved = useAfterReminderSaved();
    const [editOpen, setEditOpen] = useState(false);
    // El héroe de color pide iconos claros; la carga y el error, oscuros.
    useStatusBarClaim(note ? 'light' : 'dark');

    if (isPending || isError || !note) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('notes.detail')} />
                {isPending ? (
                    <View className="gap-3 p-4">
                        <Skeleton className="h-24 rounded-2xl w-full" />
                        <Skeleton className="h-40 rounded-2xl w-full" />
                    </View>
                ) : (
                    <EmptyState
                        icon="document-text-outline"
                        title={t('notes.notFound')}
                        action={{ label: t('common.retry'), onPress: () => void refetch() }}
                    />
                )}
            </View>
        );
    }

    function confirmDelete() {
        Alert.alert(t('notes.deleteTitle'), t('notes.deleteBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => {
                    void deleteNote.mutateAsync(note?.id ?? '');
                    router.back();
                },
            },
        ]);
    }

    return (
        <View className="flex-1 bg-background">
            <ScrollView contentContainerClassName="gap-5 pb-16">
                <NoteHero
                    note={note}
                    believerName={believer.data ? believerName(believer.data) : ''}
                />
                <NoteActions
                    note={note}
                    onEdit={() => setEditOpen(true)}
                    onToggleReminder={(done) =>
                        void updateNote.mutateAsync({ id: note.id, input: { remindDone: done } })
                    }
                    onDelete={confirmDelete}
                />
                <NoteInfo
                    note={note}
                    onDeleteAudio={(audioId) => void deleteAudio.mutateAsync(audioId)}
                />
            </ScrollView>

            <NoteFormSheet
                visible={editOpen}
                onClose={() => setEditOpen(false)}
                note={note}
                pendingAudios={[]}
                onRecorded={() => undefined}
                onSave={async (input) => {
                    await updateNote.mutateAsync({
                        id: note.id,
                        input: toUpdateInput(input, note),
                    });
                    if (input.remindAt) await afterReminderSaved();
                }}
            />
        </View>
    );
}
