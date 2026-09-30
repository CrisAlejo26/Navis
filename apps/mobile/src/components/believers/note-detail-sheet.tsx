import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { NoteCard } from '@/components/believers/note-card';
import type { LocalNote } from '@/data/repos/notes-repo';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';

/**
 * La vista previa de una nota: se lee entera —sin los recortes de la tarjeta—
 * y solo se edita si la persona lo pide. Tocar una nota de la bitácora o el
 * aviso de su recordatorio llevan aquí, nunca directos al formulario.
 */
export function NoteDetailSheet({
    note,
    onClose,
    onEdit,
    onToggleReminder,
    onDeleteAudio,
}: {
    note: LocalNote | null;
    onClose: () => void;
    onEdit: (note: LocalNote) => void;
    onToggleReminder: (note: LocalNote, done: boolean) => void;
    onDeleteAudio: (audioId: string) => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet visible={note !== null} onClose={onClose} title={t('notes.detail')}>
            {note ? (
                <View className="gap-4">
                    <NoteCard
                        note={note}
                        expanded
                        onToggleReminder={onToggleReminder}
                        onDeleteAudio={onDeleteAudio}
                    />
                    <Button
                        title={t('common.edit')}
                        variant="secondary"
                        size="lg"
                        leadingIcon="create-outline"
                        onPress={() => onEdit(note)}
                    />
                </View>
            ) : null}
        </BottomSheet>
    );
}
