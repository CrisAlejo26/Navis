import type { BelieverStatus } from '@navis/shared';

import { NEUTRAL_ACCENT } from '@/lib/export/columns';

/**
 * El color de cada estado como **acento** —token o hexadecimal—, para lo que
 * no entiende de clases: la pastilla de una exportación (RFC 0009 D9).
 *
 * Es la pareja de los puntos de `StatusBadge`, y dice lo mismo: quien acaba de
 * llegar se marca como algo que atender, y quien ya no viene se apaga.
 */
export const STATUS_ACCENT: Record<BelieverStatus, string> = {
  activo: 'success',
  nuevo: 'primary',
  inactivo: NEUTRAL_ACCENT,
  trasladado: NEUTRAL_ACCENT,
};
