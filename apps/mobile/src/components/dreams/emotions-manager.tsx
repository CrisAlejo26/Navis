import { ACCENT_PALETTE } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';

import { EmotionForm, type EmotionDraft } from '@/components/dreams/emotion-form';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import {
    useCreateEmotion,
    useDeleteEmotion,
    useEmotions,
    useUpdateEmotion,
} from '@/hooks/use-emotions';
import { accentHex } from '@/lib/accent';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { useThemeStore } from '@/lib/theme';
import { useSheetBodyMaxHeight } from '@/lib/ui/keyboard';

/**
 * El vocabulario de emociones (RFC 0005 D6), dentro de la hoja del formulario:
 * las doce de serie salen en tu idioma y no se tocan; las propias se crean, se
 * cambian y se borran — y borrar una **no** borra los sueños que la llevaban.
 */
export function EmotionsManager({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation();
    const bodyMaxHeight = useSheetBodyMaxHeight(0.55);
    const label = useEmotionLabel();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const { data: emotions = [] } = useEmotions();
    const create = useCreateEmotion();
    const update = useUpdateEmotion();
    const remove = useDeleteEmotion();
    const [draft, setDraft] = useState<EmotionDraft | null>(null);

    async function save(one: EmotionDraft) {
        const input = { name: one.name, accent: one.accent };
        if (one.id) await update.mutateAsync({ id: one.id, input });
        else await create.mutateAsync(input);
        setDraft(null);
    }

    function confirmDelete(id: string, name: string) {
        Alert.alert(t('dreams.emotionDeleteTitle', { name }), t('dreams.emotionDeleteBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => void remove.mutateAsync(id),
            },
        ]);
    }

    if (draft) return <EmotionForm draft={draft} onCancel={() => setDraft(null)} onSave={save} />;

    return (
        <View className="gap-3">
            <ScrollView style={{ maxHeight: bodyMaxHeight }} contentContainerClassName="gap-1.5">
                <Text className="text-xs text-muted-foreground">
                    {t('dreams.emotionSystemHint')}
                </Text>
                {emotions.map((emotion) => {
                    const own = emotion.slug === null;
                    return (
                        <View key={emotion.id} className="gap-3 py-1 flex-row items-center">
                            <View
                                className="size-3 rounded-full"
                                style={{ backgroundColor: accentHex(emotion.accent, palette) }}
                            />
                            <Text className="text-sm flex-1 text-foreground" numberOfLines={1}>
                                {label(emotion)}
                            </Text>
                            <Text className="text-[11px] text-muted-foreground tabular-nums">
                                {t('dreams.emotionUses', { total: emotion.count })}
                            </Text>
                            {own ? (
                                <>
                                    <IconButton
                                        icon="create-outline"
                                        accessibilityLabel={t('common.edit')}
                                        onPress={() =>
                                            setDraft({
                                                id: emotion.id,
                                                name: emotion.name ?? '',
                                                accent: emotion.accent,
                                            })
                                        }
                                    />
                                    <IconButton
                                        icon="trash-outline"
                                        accessibilityLabel={t('common.delete')}
                                        onPress={() => confirmDelete(emotion.id, label(emotion))}
                                    />
                                </>
                            ) : null}
                        </View>
                    );
                })}
            </ScrollView>
            <Button
                title={t('dreams.emotionAdd')}
                leadingIcon="add"
                onPress={() => setDraft({ id: null, name: '', accent: ACCENT_PALETTE[0] })}
            />
            <Button title={t('common.back')} variant="ghost" size="sm" onPress={onBack} />
        </View>
    );
}
