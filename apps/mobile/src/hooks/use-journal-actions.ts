import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useListContext } from './use-lists';
import { useJournalMutation } from './use-journal';
import { deleteJournalEntry, updateJournalEntry } from '@/data/repos/journal-repo';
import { shareJournalEntries } from '@/lib/journal/export';

export function useJournalActions() {
    const scope = useListContext(),
        { t } = useTranslation();
    const [selected, setSelected] = useState(new Set<string>()),
        [selectionMode, setSelectionMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null),
        [actionError, setActionError] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [deletion, setDeletion] = useState<{ ids: string[]; title: string } | null>(null);
    const remove = useJournalMutation(async (context, ids: string[]) => {
        for (const id of ids) await deleteJournalEntry(context, id);
    });
    const attendMutation = useJournalMutation((context, id: string) =>
        updateJournalEntry(context, id, { remindDone: true }),
    );
    const clearSelection = () => {
        setSelected(new Set());
        setSelectionMode(false);
    };
    const toggleSelectionMode = () => {
        setSelected(new Set());
        setSelectionMode(!selectionMode);
    };
    const toggle = (id: string) => {
        if (!scope.canManage) return;
        setSelectionMode(true);
        setSelected((before) => {
            const next = new Set(before);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    function confirmDelete(ids: string[], title?: string) {
        if (!scope.canManage || remove.isPending || exporting) return;
        setDeletion({
            ids,
            title: title
                ? t('journal.deleteTitle', { title })
                : t('journal.mobile.deleteMany', { count: ids.length }),
        });
    }
    async function deleteConfirmed() {
        if (!deletion || !scope.canManage || remove.isPending) return;
        setActionError(false);
        try {
            await remove.mutateAsync(deletion.ids);
            clearSelection();
            setDeletion(null);
        } catch {
            setActionError(true);
        }
    }
    async function exportSelection() {
        if (exporting) return;
        setExporting(true);
        setActionError(false);
        try {
            await shareJournalEntries(scope.context, [...selected], true);
            clearSelection();
        } catch {
            setActionError(true);
        } finally {
            setExporting(false);
        }
    }
    function attend(id: string) {
        setActionError(false);
        void attendMutation.mutateAsync(id).catch(() => setActionError(true));
    }
    return {
        selected,
        selectionMode,
        toggle,
        toggleSelectionMode,
        clearSelection,
        editingId,
        setEditingId,
        confirmDelete,
        deletion,
        cancelDeletion: () => {
            if (!remove.isPending) setDeletion(null);
        },
        deleteConfirmed,
        attend,
        actionError,
        exporting,
        exportSelection,
        busy: remove.isPending || attendMutation.isPending || exporting,
    };
}
