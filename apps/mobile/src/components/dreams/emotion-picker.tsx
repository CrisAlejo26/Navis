import { themeColorsHex } from '@navis/theme';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { useEmotions } from '@/hooks/use-emotions';
import { accentHex } from '@/lib/accent';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { useThemeStore } from '@/lib/theme';

interface EmotionPickerProps {
    value: readonly string[];
    onChange: (ids: string[]) => void;
    /** Abre el gestor del vocabulario: crear las propias, cambiarlas, borrarlas. */
    onManage: () => void;
}

/**
 * Las emociones que se sintieron, todas las que valgan (RFC 0005 D3): una
 * pastilla por emoción con su color —que entra por el dato, no por la
 * decoración (D7)— y su nombre al lado, porque el color no informa solo.
 */
export function EmotionPicker({ value, onChange, onManage }: EmotionPickerProps) {
    const { t } = useTranslation();
    const label = useEmotionLabel();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const { data: emotions = [] } = useEmotions();

    function toggle(id: string) {
        onChange(value.includes(id) ? value.filter((one) => one !== id) : [...value, id]);
    }

    return (
        <View className="gap-1.5 flex-row flex-wrap">
            {emotions.map((emotion) => (
                <Chip
                    key={emotion.id}
                    label={label(emotion)}
                    color={accentHex(emotion.accent, palette)}
                    selected={value.includes(emotion.id)}
                    onPress={() => toggle(emotion.id)}
                />
            ))}
            <Chip label={t('dreams.emotionsManage')} icon="options-outline" onPress={onManage} />
        </View>
    );
}
