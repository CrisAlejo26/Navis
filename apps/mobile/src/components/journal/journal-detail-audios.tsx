import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LocalJournalEntry } from '@/data/repos/journal-repo';
import { ConfirmationSheet } from '@/components/ui/confirmation-sheet';
import { JournalAudio } from './journal-audio';
import { useJournalTheme } from './journal-theme';

export function JournalDetailAudios({
    entry,
    canManage,
    onRemove,
}: {
    entry: LocalJournalEntry;
    canManage: boolean;
    onRemove: (id: string) => void;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    const [removing, setRemoving] = useState<string | null>(null);
    if (!entry.audios.length) return null;
    return (
        <View style={{ gap: 12, padding: 20, borderRadius: 26, backgroundColor: p.surface }}>
            <Text
                accessibilityRole="header"
                className="font-sans-semibold"
                style={{ color: p.ink, fontSize: 17 }}
            >
                {t('journal.audiosField')}
            </Text>
            {entry.audios.map((audio) => (
                <JournalAudio
                    key={audio.id}
                    audio={audio}
                    onRemove={canManage ? () => setRemoving(audio.id) : undefined}
                />
            ))}
            {removing && (
                <ConfirmationSheet
                    title={t('journal.removeAudio')}
                    confirmLabel={t('common.delete')}
                    onCancel={() => setRemoving(null)}
                    onConfirm={() => {
                        if (canManage) onRemove(removing);
                        setRemoving(null);
                    }}
                />
            )}
        </View>
    );
}
