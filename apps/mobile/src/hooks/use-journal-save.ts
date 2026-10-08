import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { File } from 'expo-file-system';
import { updateEntrySchema } from '@navis/shared';
import { useJournalMutation } from './use-journal';
import { useAfterReminderSaved } from './use-reminder-prompt';
import {
    createJournalEntry,
    updateJournalEntry,
    type LocalJournalEntry,
} from '@/data/repos/journal-repo';
import { addJournalAudio, deleteJournalAudio } from '@/data/repos/journal-audios';
import type { WriteDreamAudioInput } from '@/data/repos/dream-audios-repo';
import type { useJournalDraft } from '@/components/journal/journal-draft';
import { validateJournalDraft } from '@/components/journal/journal-validation';

export function useJournalSave(
    d: ReturnType<typeof useJournalDraft>,
    entry: LocalJournalEntry | undefined,
    onClose: () => void,
) {
    const { t } = useTranslation(),
        savedId = useRef(entry?.id),
        deletedAudios = useRef(new Set<string>()),
        saving = useRef(false);
    const create = useJournalMutation(createJournalEntry);
    const update = useJournalMutation(
        (context, input: { id: string; data: Parameters<typeof updateJournalEntry>[2] }) =>
            updateJournalEntry(context, input.id, input.data),
    );
    const addAudio = useJournalMutation(
        (context, input: { id: string; audio: WriteDreamAudioInput }) =>
            addJournalAudio(context, input.id, input.audio),
    );
    const remove = useJournalMutation((context, input: { id: string; audioId: string }) =>
        deleteJournalAudio(context, input.id, input.audioId),
    );
    const afterReminder = useAfterReminderSaved('note', () => d.setNotificationsDenied(true));
    async function save() {
        if (saving.current) return;
        const parsed = validateJournalDraft(d, entry, t);
        if (!parsed) return;
        saving.current = true;
        d.setSaving(true);
        d.setError(null);
        try {
            if (savedId.current)
                await update.mutateAsync({
                    id: savedId.current,
                    data: updateEntrySchema.parse({
                        ...parsed.data,
                        learned: d.learned || null,
                        remindAt: parsed.at ?? null,
                        remindText: parsed.at ? d.remindText || null : null,
                    }),
                });
            else savedId.current = await create.mutateAsync(parsed.data);
            for (const audioId of d.removed) {
                if (deletedAudios.current.has(audioId)) continue;
                await remove.mutateAsync({ id: savedId.current, audioId });
                deletedAudios.current.add(audioId);
            }
            for (const audio of [...d.pending]) {
                await addAudio.mutateAsync({
                    id: savedId.current,
                    audio: {
                        ...audio,
                        sizeBytes: audio.sizeBytes || new File(audio.sourceUri).size,
                    },
                });
                d.setPending((previous) => previous.filter((one) => one !== audio));
            }
            if (parsed.at && (await afterReminder()) === false) return;
            onClose();
        } catch {
            d.setError(t('errors.generic'));
        } finally {
            saving.current = false;
            d.setSaving(false);
        }
    }
    return save;
}
