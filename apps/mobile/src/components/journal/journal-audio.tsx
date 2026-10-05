import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useJournalPalette } from './journal-theme';

export function JournalAudio({
    audio,
    onRemove,
}: {
    audio: { uri: string; durationSeconds: number | null };
    onRemove?: () => void;
}) {
    const player = useAudioPlayer(audio.uri),
        status = useAudioPlayerStatus(player),
        p = useJournalPalette(),
        { t } = useTranslation();
    const duration = audio.durationSeconds ?? Math.round(status.duration || 0);
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                padding: 8,
                borderRadius: 16,
                backgroundColor: p.surface,
            }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                    status.playing ? t('common.audio.stop') : t('common.audio.title')
                }
                onPress={() => {
                    if (status.playing) player.pause();
                    else {
                        if (status.didJustFinish) void player.seekTo(0);
                        player.play();
                    }
                }}
                style={({ pressed }) => ({
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: p.card,
                    opacity: pressed ? 0.6 : 1,
                })}
            >
                <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color={p.primary} />
            </Pressable>
            <Text style={{ color: p.ink, flex: 1, fontSize: 14 }}>
                {t('common.audio.title')} · {Math.floor(duration / 60)}:
                {String(duration % 60).padStart(2, '0')}
            </Text>
            {onRemove && (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('journal.removeAudio')}
                    onPress={onRemove}
                    style={({ pressed }) => ({
                        width: 48,
                        height: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.6 : 1,
                    })}
                >
                    <Ionicons name="trash-outline" size={20} color={p.destructive} />
                </Pressable>
            )}
        </View>
    );
}
