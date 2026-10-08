import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AudioRecorder } from '@/components/believers/audio-recorder';
import type { LocalJournalEntry } from '@/data/repos/journal-repo';
import type { useJournalForm } from '@/hooks/use-journal-form';
import { JournalAudio } from './journal-audio';
import { JournalSection } from './journal-section';

export function JournalFormAudios({
    form: f,
    entry,
}: {
    form: ReturnType<typeof useJournalForm>;
    entry?: LocalJournalEntry;
}) {
    const { t } = useTranslation();
    return (
        <JournalSection
            title={t('journal.audiosField')}
            icon="mic-outline"
            open={f.audiosOpen}
            onToggle={() => f.setAudiosOpen(!f.audiosOpen)}
            summary={String((entry?.audios.length ?? 0) - f.removed.length + f.pending.length)}
        >
            {entry?.audios
                .filter((audio) => !f.removed.includes(audio.id))
                .map((audio) => (
                    <JournalAudio
                        key={audio.id}
                        audio={audio}
                        onRemove={() => f.setRemoved((previous) => [...previous, audio.id])}
                    />
                ))}
            {f.pending.map((audio, index) => (
                <JournalAudio
                    key={`${audio.sourceUri}:${index}`}
                    audio={{ uri: audio.sourceUri, durationSeconds: audio.durationSeconds }}
                    onRemove={() =>
                        f.setPending((previous) => previous.filter((_, i) => i !== index))
                    }
                />
            ))}
            <AudioRecorder
                onFinish={(audio) =>
                    f.setPending((previous) => [
                        ...previous,
                        {
                            sourceUri: audio.uri,
                            durationSeconds: audio.durationSeconds,
                            mimeType: 'audio/mp4',
                            sizeBytes: 0,
                            recorded: true,
                        },
                    ])
                }
            />
            <Button
                title={t('journal.attachAudio')}
                variant="secondary"
                leadingIcon="attach-outline"
                onPress={() => void f.attach()}
            />
        </JournalSection>
    );
}
