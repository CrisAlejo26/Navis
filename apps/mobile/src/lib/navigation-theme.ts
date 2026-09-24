import { themeColorsHex } from '@navis/theme';
import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

import { useThemeStore } from '@/lib/theme';

/**
 * El tema del contenedor de navegación de expo-router, aparte del de Navis.
 * Sin construirlo a partir de `themeColorsHex`, usa su `DefaultTheme`/
 * `DarkTheme` de serie (fondo `rgb(242, 242, 242)` en claro, `rgb(1, 1, 1)`
 * en oscuro), que no coincide con la paleta: no se nota **entrando** a una
 * pantalla —la tapa entera de inmediato— pero sí **saliendo**, un fotograma,
 * mientras la de abajo vuelve a ser la visible; en oscuro es un flash blanco
 * de verdad.
 */
export function useNavigationTheme(): Theme {
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const palette = themeColorsHex[resolvedTheme];
    const base = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;

    return {
        ...base,
        dark: resolvedTheme === 'dark',
        colors: {
            ...base.colors,
            primary: palette.primary,
            background: palette.background,
            card: palette.card,
            text: palette.foreground,
            border: palette.border,
            notification: palette.destructive,
        },
    };
}
