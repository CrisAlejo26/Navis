import { themeColorsHex } from '@navis/theme';

import { useThemeStore } from '@/lib/theme';

/** Los tokens del tema activo como hex de verdad: los props nativos no entienden `oklch`. */
export function useUserPalette() {
    const theme = useThemeStore((state) => state.resolvedTheme);
    return { ...themeColorsHex[theme], dark: theme === 'dark' };
}
