import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AudioRecorder } from '@/components/believers/audio-recorder';
import type { PendingAudio } from '@/components/dreams/dream-form-values';
import { Icon } from '@/components/ui/icon';

/**
 * Los audios que se graban con el formulario abierto: se copian al guardar el
 * sueño, como en las notas de creyentes. Solo enseña cuántos hay: reproducirlos
 * o quitarlos es cosa de la ficha, ya con el sueño guardado.
 */
export function DreamAudioField({
    value,
    onChange,
}: {
    value: readonly PendingAudio[];
    onChange: (audios: PendingAudio[]) => void;
}) {
    const { t } = useTranslation();

    return (
        <View className="gap-2">
            <Text className="text-sm font-sans-medium text-foreground">
                {t('common.audio.title')}
            </Text>
            <AudioRecorder onFinish={(audio) => onChange([...value, audio])} />
            {value.map((audio, index) => (
                <View key={audio.uri} className="gap-1 flex-row items-center">
                    <Icon name="mic" size="sm" tone="primary" />
                    <Text className="text-xs text-muted-foreground">
                        {t('common.audio.count', { total: index + 1 })}
                        {audio.durationSeconds ? ` · ${audio.durationSeconds}s` : ''}
                    </Text>
                </View>
            ))}
        </View>
    );
}
