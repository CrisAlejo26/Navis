import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { useThemeStore } from '@/lib/theme';
import { hexBlend } from '@/lib/color';
import type { EntryKind } from '@navis/shared';
import { JOURNAL_KINDS } from './journal-kinds';

export type JournalPalette = ThemeColors & {
    dark: boolean;
    link: string;
    surface: string;
    ink: string;
    secondaryInk: string;
    line: string;
};
export function useJournalTheme(): JournalPalette {
    const dark = useThemeStore((state) => state.resolvedTheme) === 'dark';
    const base = themeColorsHex[dark ? 'dark' : 'light'];
    return {
        ...base,
        dark,
        link: hexBlend(base.primary, base.foreground, dark ? 0.4 : 0),
        surface: base.muted,
        ink: base.foreground,
        secondaryInk: base.mutedForeground,
        line: base.border,
    };
}
export function kindColor(kind: EntryKind, palette: JournalPalette): string {
    return hexBlend(
        palette[JOURNAL_KINDS[kind].token],
        palette.foreground,
        palette.dark ? 0.45 : 0.4,
    );
}
