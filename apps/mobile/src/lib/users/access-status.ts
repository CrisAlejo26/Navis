import type { ListViewer } from '@navis/shared';

export type AccessStatus = 'active' | 'expired' | 'inactive';

/**
 * En qué estado está un acceso de lectura: desactivado a mano, caducado por fecha o
 * en vigor. Un acceso desactivado cuenta como tal aunque además haya caducado:
 * es lo que decidió quien lo gestiona, y lo que se enseña.
 */
export function accessStatus(
    viewer: Pick<ListViewer, 'isActive' | 'expiresAt'>,
    now: Date = new Date(),
): AccessStatus {
    if (!viewer.isActive) return 'inactive';
    if (viewer.expiresAt && Date.parse(viewer.expiresAt) < now.getTime()) return 'expired';
    return 'active';
}

export function accessCounts(
    viewers: readonly Pick<ListViewer, 'isActive' | 'expiresAt'>[],
    now: Date = new Date(),
): Record<AccessStatus, number> {
    const counts: Record<AccessStatus, number> = { active: 0, expired: 0, inactive: 0 };
    for (const viewer of viewers) counts[accessStatus(viewer, now)] += 1;
    return counts;
}

/** Busca por la etiqueta, el usuario o el nombre del creyente, sin distinguir mayúsculas ni acentos. */
export function accessMatches(
    viewer: Pick<ListViewer, 'label' | 'username' | 'believerName'>,
    term: string,
): boolean {
    const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const needle = fold(term.trim());
    if (needle === '') return true;
    return [viewer.label, viewer.username, viewer.believerName ?? ''].some((one) =>
        fold(one).includes(needle),
    );
}
