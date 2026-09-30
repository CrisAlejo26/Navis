import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text } from 'react-native';

interface SignOutButtonProps {
    onConfirm: () => void;
}

/**
 * Cerrar sesión pregunta antes. Va con borde rojo y fondo de tarjeta, no
 * relleno: es una salida, no la acción principal de la pantalla.
 */
export function SignOutButton({ onConfirm }: SignOutButtonProps) {
    const { t } = useTranslation();

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
            className="h-13 rounded-2xl items-center justify-center border-[1.5px] border-destructive bg-card active:opacity-70"
        >
            <Text className="text-base font-sans-semibold text-destructive">
                {t('auth.signOut')}
            </Text>
        </Pressable>
    );
}
