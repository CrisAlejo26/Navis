import { setAudioModeAsync, useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/**
 * La grabación de una nota de voz (§7.6 en móvil): cronómetro visible y un
 * solo botón que cambia de Grabar a Parar. Sin permiso se dice y no se
 * ofrece grabar — quedarse mudo sin explicación no es un estado, es un fallo.
 * El fichero se queda en memoria: sube al guardar la nota, igual que en la web.
 */
export function AudioRecorder({
    onFinish,
}: {
    onFinish: (audio: { uri: string; durationSeconds: number | null }) => void;
}) {
    const { t } = useTranslation();
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [denied, setDenied] = useState(false);

    useEffect(() => {
        if (!recording) return;
        const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
        return () => clearInterval(timer);
    }, [recording]);

    async function start() {
        try {
            const permission = await AudioModule.requestRecordingPermissionsAsync();
            if (!permission.granted) {
                setDenied(true);
                return;
            }
            await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
            await recorder.prepareToRecordAsync();
            recorder.record();
            setSeconds(0);
            setRecording(true);
        } catch {
            setDenied(true);
        }
    }

    async function stop() {
        await recorder.stop();
        setRecording(false);
        if (recorder.uri) {
            onFinish({ uri: recorder.uri, durationSeconds: seconds > 0 ? seconds : null });
        }
    }

    if (denied) {
        return (
            <View className="gap-1.5 flex-row items-center">
                <Icon name="mic-off-outline" size="sm" tone="warning" />
                <Text className="text-xs flex-1 text-muted-foreground">
                    {t('common.audio.unsupported')}
                </Text>
            </View>
        );
    }

    return (
        <View className="gap-2 flex-row items-center">
            <Button
                title={recording ? t('common.audio.stop') : t('common.audio.record')}
                variant={recording ? 'destructive' : 'secondary'}
                size="sm"
                leadingIcon={recording ? 'stop' : 'mic'}
                onPress={() => void (recording ? stop() : start())}
            />
            {recording ? (
                <Text className="text-sm text-destructive tabular-nums">
                    {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                    {String(seconds % 60).padStart(2, '0')}
                </Text>
            ) : null}
        </View>
    );
}
