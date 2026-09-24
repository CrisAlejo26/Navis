import { themeColorsHex } from '@navis/theme';
import { StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/lib/theme';

/**
 * Fondo del Stack raíz, montado una sola vez detrás de toda la navegación
 * (como el `AppBackdrop` de Dreamkeeper): las pantallas llevan `contentStyle`
 * transparente, así que el fotograma en blanco que deja el Fragment de
 * Android al volver atrás (`lib/pushed-screens.ts`) muestra este fondo fijo
 * en vez del blanco por defecto de la ventana nativa.
 */
export function AppBackdrop() {
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

    return (
        <View
            style={[
                StyleSheet.absoluteFill,
                { backgroundColor: themeColorsHex[resolvedTheme].background },
            ]}
            pointerEvents="none"
        />
    );
}
