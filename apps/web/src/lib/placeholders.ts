import type { Permission } from '@navis/shared';

import type { NavKey } from '@/routes/placeholder';

/**
 * Las secciones que todavía son un puente a su RFC. Van en una lista y no
 * escritas una a una porque son la misma ruta seis veces: cuando una se
 * implemente, sale de aquí y se escribe con su propia pantalla.
 */
export const PUENTES = [
  {
    path: 'dreams',
    titleKey: 'nav.dreams',
    rfc: '0005-suenos-personales.md',
    permission: 'dreams.view',
  },
  {
    path: 'communications',
    titleKey: 'nav.communications',
    rfc: '0006-comunicaciones.md',
    permission: 'communications.view',
  },
] as const satisfies readonly {
  path: string;
  titleKey: NavKey;
  rfc: string;
  permission: Permission;
}[];
