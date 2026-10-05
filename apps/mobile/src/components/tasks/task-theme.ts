import { accentHex, themeColorsHex } from '@navis/theme';
import { useThemeStore } from '@/lib/theme';
export function useTaskPalette() {
    const theme = useThemeStore((state) => state.resolvedTheme);
    return {
        ...themeColorsHex[theme],
        dark: theme === 'dark',
        accent: (value: string) => accentHex(value, theme),
    };
}
export const statusKeys = {
    pendiente: 'tasks.statusPending',
    en_progreso: 'tasks.statusInProgress',
    completada: 'tasks.statusDone',
} as const;
export const priorityKeys = {
    baja: 'tasks.priorityLow',
    media: 'tasks.priorityMedium',
    alta: 'tasks.priorityHigh',
} as const;
