import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDocumentAsync } from 'expo-document-picker';
import type { LocalJournalEntry } from '@/data/repos/journal-repo';
import { todayIso } from '@/data/repos/dashboard-repo';
import { useJournalDraft, localJournalReminder } from '@/components/journal/journal-draft';
import { useJournalSave } from './use-journal-save';

export function useJournalForm(entry: LocalJournalEntry | undefined, onClose: () => void) {
    const d = useJournalDraft(entry),
        { t } = useTranslation(),
        save = useJournalSave(d, entry, onClose);
    const [discarding, setDiscarding] = useState(false);
    const initialReminder = localJournalReminder(entry?.remindAt);
    function close() {
        if (d.saving) return;
        const dirty =
            d.title !== (entry?.title ?? '') ||
            d.annotation !== (entry?.annotation ?? '') ||
            d.learned !== (entry?.learned ?? '') ||
            d.kind !== (entry?.kind ?? 'observacion') ||
            d.day !== (entry?.occurredAt ?? todayIso()) ||
            d.remindOn !== Boolean(entry?.remindAt) ||
            d.reminder.date !== initialReminder.date ||
            d.reminder.time !== initialReminder.time ||
            d.remindText !== (entry?.remindText ?? '') ||
            d.pending.length > 0 ||
            d.removed.length > 0;
        if (!dirty) return onClose();
        setDiscarding(true);
    }
    async function attach() {
        try {
            const picked = await getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
                multiple: true,
            });
            if (!picked.canceled)
                d.setPending((previous) => [
                    ...previous,
                    ...picked.assets.map((asset) => ({
                        sourceUri: asset.uri,
                        mimeType: asset.mimeType ?? 'audio/mp4',
                        sizeBytes: asset.size ?? 0,
                        durationSeconds: null,
                        recorded: false,
                    })),
                ]);
        } catch {
            d.setError(t('common.audio.failed'));
        }
    }
    return {
        ...d,
        discarding,
        cancelDiscard: () => setDiscarding(false),
        confirmDiscard: onClose,
        close,
        attach,
        save,
    };
}
