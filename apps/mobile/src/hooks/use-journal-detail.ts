import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useJournalEntry, useJournalMutation } from './use-journal';
import { useListContext } from './use-lists';
import { deleteJournalEntry, updateJournalEntry } from '@/data/repos/journal-repo';
import { deleteJournalAudio } from '@/data/repos/journal-audios';

export function useJournalDetail(id: string) {
    const { t } = useTranslation(),
        scope = useListContext(),
        result = useJournalEntry(id),
        entry = result.data;
    const [editing, setEditing] = useState(false),
        [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const remove = useJournalMutation(deleteJournalEntry);
    const update = useJournalMutation((context, done: boolean) =>
        updateJournalEntry(context, id, { remindDone: done }),
    );
    const audio = useJournalMutation((context, audioId: string) =>
        deleteJournalAudio(context, id, audioId),
    );
    function confirmDelete() {
        if (!scope.canManage || remove.isPending) return;
        setDeleting(true);
    }
    async function deleteConfirmed() {
        if (!scope.canManage || remove.isPending) return;
        setError(null);
        try {
            await remove.mutateAsync(id);
            router.replace('/journal/list');
        } catch {
            setError(t('errors.generic'));
        }
    }
    function attend() {
        setError(null);
        void update.mutateAsync(!entry?.remindDoneAt).catch(() => setError(t('errors.generic')));
    }
    function removeAudio(audioId: string) {
        void audio.mutateAsync(audioId).catch(() => setError(t('errors.generic')));
    }
    return {
        scope,
        result,
        entry,
        editing,
        setEditing,
        error,
        confirmDelete,
        deleting,
        cancelDeletion: () => {
            if (!remove.isPending) setDeleting(false);
        },
        deleteConfirmed,
        attend,
        removeAudio,
        busy: remove.isPending || update.isPending || audio.isPending,
    };
}
