import type { EntryKind } from '@navis/shared';
import type { ThemeColors } from '@navis/theme';
import type { IoniconName } from '@/lib/nav-mobile';

export const JOURNAL_KINDS = {
    observacion: { icon: 'eye-outline', token: 'primary', label: 'journal.kind.observacion' },
    testimonio: {
        icon: 'chatbubble-ellipses-outline',
        token: 'accent',
        label: 'journal.kind.testimonio',
    },
    sueno: { icon: 'moon-outline', token: 'secondary', label: 'journal.kind.sueno' },
    bienHecho: { icon: 'thumbs-up-outline', token: 'success', label: 'journal.kind.bienHecho' },
    correccion: { icon: 'chatbox-outline', token: 'destructive', label: 'journal.kind.correccion' },
    oracion: { icon: 'heart-outline', token: 'mutedForeground', label: 'journal.kind.oracion' },
    decision: { icon: 'compass-outline', token: 'warning', label: 'journal.kind.decision' },
} as const satisfies Record<
    EntryKind,
    { icon: IoniconName; token: keyof ThemeColors; label: `journal.kind.${EntryKind}` }
>;

export const KIND_ICON: Record<EntryKind, IoniconName> = Object.fromEntries(
    Object.entries(JOURNAL_KINDS).map(([kind, value]) => [kind, value.icon]),
) as Record<EntryKind, IoniconName>;
