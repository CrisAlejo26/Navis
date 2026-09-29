import { Ionicons } from '@expo/vector-icons';
import type { DreamState } from '@navis/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DREAM_STATE_ICONS, DREAM_STATE_TONE } from '@/components/dreams/dream-icons';
import { AppBar } from '@/components/ui/app-bar';
import { Badge } from '@/components/ui/badge';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

/**
 * El degradado de la cabecera cambia con el estado, como el de profecías: la
 * noche (apuntado), el azul de la marca (en estudio) y el verde del amanecer
 * (cumplido). Hexadecimales a mano: no hay token para un degradado.
 */
const GRADIENTS: Record<DreamState, { light: [string, string]; dark: [string, string] }> = {
    apuntado: { light: ['#5b6a99', '#34406b'], dark: ['#2a3357', '#141a33'] },
    estudio: { light: ['#4d70f0', '#2140cf'], dark: ['#1d358f', '#101f66'] },
    cumplido: { light: ['#4fb286', '#1f7a52'], dark: ['#1c5c3d', '#0f3b27'] },
};

interface DreamDetailHeaderProps {
    title: string;
    dreamedAt: string;
    state: DreamState;
    onEdit: () => void;
    onDelete: () => void;
}

export function DreamDetailHeader({
    title,
    dreamedAt,
    state,
    onEdit,
    onDelete,
}: DreamDetailHeaderProps) {
    const { t } = useTranslation();
    const dark = useThemeStore((store) => store.resolvedTheme) === 'dark';

    return (
        <View className="rounded-b-3xl overflow-hidden">
            <LinearGradient colors={GRADIENTS[state][dark ? 'dark' : 'light']}>
                <AppBar
                    onScene
                    title=""
                    actions={[
                        { icon: 'create-outline', label: t('dreams.edit'), onPress: onEdit },
                        { icon: 'trash-outline', label: t('common.delete'), onPress: onDelete },
                    ]}
                />
                <View className="gap-3 px-4 pb-6 items-center">
                    <View className="w-14 h-14 bg-white/20 border-white/30 items-center justify-center rounded-full border-2">
                        <Ionicons
                            name={DREAM_STATE_ICONS[state]}
                            size={26}
                            color="white"
                            aria-hidden
                        />
                    </View>
                    <Text
                        className="text-2xl font-sans-bold text-white text-center"
                        numberOfLines={3}
                    >
                        {title}
                    </Text>
                    <Text
                        className="text-sm text-center"
                        style={{ color: 'rgba(255,255,255,0.85)' }}
                    >
                        {t('dreams.dreamedOn', { date: formatDay(dreamedAt) })}
                    </Text>
                    <Badge
                        onScene
                        label={t(`dreams.state.${state}`)}
                        tone={DREAM_STATE_TONE[state]}
                        icon={DREAM_STATE_ICONS[state]}
                    />
                </View>
            </LinearGradient>
        </View>
    );
}
