import { themeColorsHex } from '@navis/theme';
import { useThemeStore } from '@/lib/theme';
import type { EntryKind } from '@navis/shared';
import type { IoniconName } from '@/lib/nav-mobile';

/** Tomtask: flat surfaces, soft section backgrounds, generous rounded controls. */
export function useJournalPalette() {
    const dark = useThemeStore((state) => state.resolvedTheme) === 'dark';
    const base = themeColorsHex[dark ? 'dark' : 'light'];
    return {
        ...base,
        dark,
        link: dark ? '#A6B5FF' : base.primary,
        surface: dark ? '#1A1C28' : '#F4F6FF',
        ink: dark ? '#ECEEF8' : '#1E2340',
        secondaryInk: dark ? '#B7BDD0' : '#626B85',
        line: dark ? '#383D55' : '#E6E9F5',
    };
}
export const KIND_ICON: Record<EntryKind, IoniconName> = {
    observacion: 'eye-outline',
    testimonio: 'chatbubble-ellipses-outline',
    sueno: 'moon-outline',
    bienHecho: 'thumbs-up-outline',
    correccion: 'alert-circle-outline',
    oracion: 'heart-outline',
    decision: 'git-branch-outline',
};

export function kindColor(kind: EntryKind, palette: ReturnType<typeof useJournalPalette>) {
    return {
        observacion: palette.link,
        testimonio: palette.dark ? '#F1C064' : '#94620C',
        sueno: palette.dark ? '#B7A0E1' : '#7751A8',
        bienHecho: palette.dark ? '#7BCCAA' : '#237451',
        correccion: palette.dark ? '#F5939E' : '#B84450',
        oracion: palette.dark ? '#EAA1C0' : '#A44873',
        decision: palette.dark ? '#ECB66B' : '#945C1C',
    }[kind];
}
