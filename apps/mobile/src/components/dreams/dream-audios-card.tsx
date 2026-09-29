import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AudioLine } from '@/components/audio-line';
import { AudioRecorder } from '@/components/believers/audio-recorder';
import { Card } from '@/components/ui/card';
import type { WriteDreamAudioInput } from '@/data/repos/dream-audios-repo';
import type { LocalDream } from '@/data/repos/dreams-repo';

interface DreamAudiosProps {
    dream: LocalDream;
    onAdd: (audio: WriteDreamAudioInput) => void;
    onRemove: (audioId: string) => void;
}

export function DreamAudios({ dream, onAdd, onRemove }: DreamAudiosProps) {
    const { t } = useTranslation();
    return (
        <Card className="rounded-2xl">
            <Text className="text-sm font-sans-semibold text-foreground">
                {t('common.audio.title')}
            </Text>
            {dream.audios.map((audio) => (
                <AudioLine key={audio.id} audio={audio} onDelete={() => onRemove(audio.id)} />
            ))}
            <AudioRecorder
                onFinish={({ uri, durationSeconds }) =>
                    onAdd({
                        sourceUri: uri,
                        mimeType: 'audio/mp4',
                        sizeBytes: 0,
                        durationSeconds,
                        recorded: true,
                    })
                }
            />
        </Card>
    );
}
