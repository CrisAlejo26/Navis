import { useTranslation } from 'react-i18next';
import { themeColorsHex } from '@navis/theme';
import { Alert, Pressable, Text } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { useThemeStore } from '@/lib/theme';
import { hexAlpha } from '@/lib/color';
import { settingsButtonEffect } from './settings-effects';

interface SignOutButtonProps {
    onConfirm: () => void;
}

/**
 * Cerrar sesión conserva la confirmación y usa profundidad del tono de peligro.
 */
export function SignOutButton({ onConfirm }: SignOutButtonProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

    function ask(): void {
        Alert.alert(t('settings.signOutTitle'), t('settings.signOutBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('auth.signOut'), style: 'destructive', onPress: onConfirm },
        ]);
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth.signOut')}
            onPress={ask}
            className="min-h-13 gap-2 py-3 rounded-2xl flex-row items-center justify-center border border-destructive/30"
            style={({ pressed }) => ({
                backgroundColor: hexAlpha(palette.destructive, 0.08),
                ...settingsButtonEffect(palette.destructive, pressed),
            })}
        >
            <Icon name="log-out-outline" tone="destructive" />
            <Text className="text-base font-sans-semibold text-destructive">
                {t('auth.signOut')}
            </Text>
        </Pressable>
    );
}
