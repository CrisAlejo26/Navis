import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { useAudioPlayer } from 'expo-audio';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';

/**
 * Una línea de audio: reproducir/pausar, cuánto dura y quitarlo. La comparten
 * las notas de creyentes y los sueños (Regla 1: segundo uso, se saca).
 */
export function AudioLine({
    audio,
    onDelete,
}: {
    audio: { uri: string; durationSeconds: number | null; recorded: boolean };
    onDelete: () => void;
}) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const player = useAudioPlayer(audio.uri);
    const [playing, setPlaying] = useState(false);

    function toggle() {
        if (playing) {
            player.pause();
            setPlaying(false);
        } else {
            player.play();
            setPlaying(true);
        }
    }

    return (
        <View className="gap-2 flex-row items-center">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.audio.title')}
                onPress={toggle}
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: hexAlpha(palette.primary, 0.12) }}
            >
                <Ionicons name={playing ? 'pause' : 'play'} size={14} color={palette.primary} />
            </Pressable>
            <Text className="text-xs flex-1 text-muted-foreground tabular-nums">
                {audio.durationSeconds
                    ? `${Math.floor(audio.durationSeconds / 60)}:${String(audio.durationSeconds % 60).padStart(2, '0')}`
                    : '—'}
                {audio.recorded ? ` · ${t('common.audio.recorded')}` : ''}
            </Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.audio.remove')}
                onPress={onDelete}
                className="h-8 w-8 items-center justify-center rounded-full"
            >
                <Ionicons name="trash-outline" size={14} color={palette.mutedForeground} />
            </Pressable>
        </View>
    );
}
