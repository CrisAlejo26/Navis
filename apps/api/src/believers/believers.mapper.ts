import { believerName, type Believer as BelieverView } from '@navis/shared';

import type { Believer } from './believer.entity';

/**
 * De la entidad a lo que viaja: los ministerios como lista de textos, que es
 * como los consume la interfaz, y no como filas de una tabla intermedia.
 */
export function toBelieverView(believer: Believer): BelieverView {
  return {
    id: believer.id,
    churchId: believer.churchId,
    congregationId: believer.congregationId,
    firstName: believer.firstName,
    lastName: believer.lastName,
    phone: believer.phone,
    isActive: believer.isActive,
    ministries: (believer.ministries ?? []).map((one) => one.ministry),
  };
}

/** El nombre compuesto, que es lo que se pinta en la cinta y en la lámina. */
export function fullName(believer: Believer): string {
  return believerName(believer);
}
