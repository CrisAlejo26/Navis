import { Ionicons } from '@expo/vector-icons';
import type { ProphecyState } from '@navis/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBar } from '@/components/ui/app-bar';
import { Badge } from '@/components/ui/badge';
import { PROPHECY_STATE_ICONS, PROPHECY_STATE_TONE } from '@/components/prophecies/prophecy-icons';
import { useThemeStore } from '@/lib/theme';

/** El degradado de la cabecera cambia con el estado (§2.1: ámbar/azul/verde). */
const GRADIENTS: Record<ProphecyState, { light: [string, string]; dark: [string, string] }> = {
    espera: { light: ['#f2c14e', '#c98a1f'], dark: ['#8a6212', '#5c3f0a'] },
    camino: { light: ['#4d70f0', '#2140cf'], dark: ['#1d358f', '#101f66'] },
    cumplida: { light: ['#4fb286', '#1f7a52'], dark: ['#1c5c3d', '#0f3b27'] },
};

interface ProphecyDetailHeaderProps {
    title: string;
    state: ProphecyState;
    onEdit: () => void;
    onDelete: () => void;
}

export function ProphecyDetailHeader({
    title,
    state,
    onEdit,
    onDelete,
}: ProphecyDetailHeaderProps) {
    const { t } = useTranslation();
    const tema = useThemeStore((store) => store.resolvedTheme);
    const colors = GRADIENTS[state][tema === 'dark' ? 'dark' : 'light'];

    return (
        <View className="rounded-b-3xl overflow-hidden">
            <LinearGradient colors={colors}>
                <AppBar
                    onScene
                    title=""
                    actions={[
                        { icon: 'create-outline', label: t('prophecies.edit'), onPress: onEdit },
                        { icon: 'trash-outline', label: t('common.delete'), onPress: onDelete },
                    ]}
                />
                <View className="gap-3 px-4 pb-6 items-center">
                    <View className="w-14 h-14 bg-white/20 border-white/30 items-center justify-center rounded-full border-2">
                        <Ionicons
                            name={PROPHECY_STATE_ICONS[state]}
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
                    <Badge
                        onScene
                        label={t(`prophecies.state.${state}`)}
                        tone={PROPHECY_STATE_TONE[state]}
                        icon={PROPHECY_STATE_ICONS[state]}
                    />
                </View>
            </LinearGradient>
        </View>
    );
}
