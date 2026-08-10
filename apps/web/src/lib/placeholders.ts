import type { Permission } from '@navis/shared';

import type { NavKey } from '@/routes/placeholder';

/**
 * Las secciones que todavía son un puente a su RFC. Van en una lista y no
 * escritas una a una porque son la misma ruta seis veces: cuando una se
 * implemente, sale de aquí y se escribe con su propia pantalla.
 *
 * Vacía desde que RFC 0016 sustituyó el puente de comunicaciones por la
 * pantalla real: se queda declarada, tipada, para la próxima sección que
 * todavía sea solo un documento.
 */
export const PUENTES = [] as const satisfies readonly {
  path: string;
  titleKey: NavKey;
  rfc: string;
  permission: Permission;
}[];
