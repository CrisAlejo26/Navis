import { themeColorsHex } from '@navis/theme';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { LocalDream } from '@/data/repos/dreams-repo';
import { accentHex } from '@/lib/accent';
import { hexAlpha } from '@/lib/color';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { useThemeStore } from '@/lib/theme';

/** Las piezas de la ficha de un sueño: cada lectura las combina a su manera. Audios y cumplimiento, en su fichero. */

export function DreamBody({ dream, large = false }: { dream: LocalDream; large?: boolean }) {
    const label = useEmotionLabel();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

    return (
        <Card className="rounded-2xl">
            <Text
                className={`text-foreground ${large ? 'text-lg leading-8' : 'text-base leading-6'}`}
            >
                {dream.body}
            </Text>
            {dream.emotions.length > 0 ? (
                <View className="gap-1.5 flex-row flex-wrap">
                    {dream.emotions.map((emotion) => {
                        const color = accentHex(emotion.accent, palette);
                        return (
                            <View
                                key={emotion.id}
                                className="gap-1 px-2 py-0.5 flex-row items-center rounded-full border"
                                style={{
                                    borderColor: hexAlpha(color, 0.35),
                                    backgroundColor: hexAlpha(color, 0.1),
                                }}
                            >
                                <View
                                    className="size-1.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <Text className="font-sans-medium text-[11px] text-foreground">
                                    {label(emotion)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            ) : null}
        </Card>
    );
}

export function DreamInterpretation({ dream, onEdit }: { dream: LocalDream; onEdit: () => void }) {
    const { t } = useTranslation();
    return (
        <Card className="rounded-2xl">
            <Text className="text-sm font-sans-semibold text-foreground">
                {t('dreams.interpretation')}
            </Text>
            {dream.interpretation ? (
                <Text className="text-base leading-6 text-foreground">{dream.interpretation}</Text>
            ) : (
                <>
                    <Text className="text-sm text-muted-foreground">
                        {t('dreams.interpretationEmpty')}
                    </Text>
                    <Button
                        title={t('dreams.interpretationAdd')}
                        variant="secondary"
                        size="sm"
                        onPress={onEdit}
                    />
                </>
            )}
        </Card>
    );
}
